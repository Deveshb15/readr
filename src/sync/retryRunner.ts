import { articleFromMeta, type Article } from '../data/article';
import { isArticleMeta, statusFor, type ArticleMeta } from '../data/articleMeta';
import type { ArticleRepo } from '../data/repo';
import type { ExtractResult } from '../extract/extract';
import { backoffMs, buildQueue, metaFromExtraction, prepareHtmlForExtraction } from './retryPlan';

/** Everything the retry loop touches, injectable for tests. */
export type RetryDeps = {
  repo: ArticleRepo;
  isOnline: () => boolean;
  now: () => number;
  readMeta: (id: string) => string | null;
  writeMeta: (id: string, meta: ArticleMeta) => void;
  writeContent: (id: string, html: string) => void;
  fetchHtml: (url: string) => Promise<string | null>;
  extract: (html: string, url: string) => Promise<ExtractResult>;
  downloadImage: (id: string, src: string, file: string) => Promise<boolean>;
  makeThumbnail: (id: string, file: string) => Promise<boolean>;
  /** Called after an article's files and row changed (refresh size, search index, store). */
  onArticleChanged: (id: string) => void;
};

const IMAGE_CONCURRENCY = 4;

function readMeta(deps: RetryDeps, id: string): ArticleMeta | null {
  const raw = deps.readMeta(id);
  if (!raw) return null;
  try {
    const m: unknown = JSON.parse(raw);
    return isArticleMeta(m) ? m : null;
  } catch {
    return null;
  }
}

function fail(deps: RetryDeps, a: Article) {
  const attempts = a.retryAttempts + 1;
  deps.repo.patch(a.id, { retryAttempts: attempts, nextRetryAt: deps.now() + backoffMs(attempts) });
}

async function completeImages(deps: RetryDeps, meta: ArticleMeta): Promise<ArticleMeta> {
  const pending = meta.images.filter((i) => !i.done);
  const next = { ...meta, images: meta.images.map((i) => ({ ...i })) };
  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      if (!deps.isOnline()) return;
      const img = pending[cursor++];
      const ok = await deps.downloadImage(meta.id, img.src, img.file).catch(() => false);
      // Only count an image done if we were still online when it finished.
      if (ok && deps.isOnline()) next.images[img.index] = { ...next.images[img.index], done: true };
    }
  };
  await Promise.all(Array.from({ length: Math.min(IMAGE_CONCURRENCY, pending.length) }, worker));
  if (!next.hasThumb) {
    const first = next.images.find((i) => i.done);
    if (first) next.hasThumb = await deps.makeThumbnail(meta.id, first.file).catch(() => false);
  }
  next.status = statusFor(next);
  return next;
}

async function retryOne(deps: RetryDeps, a: Article, reextract = false): Promise<void> {
  let meta = readMeta(deps, a.id);
  if (!meta) return fail(deps, a);

  // Re-extract link-only saves, or any save the user asked to refresh. Existing content
  // is only replaced after a successful extraction, so a failed refresh loses nothing.
  if (meta.status === 'link_only' || reextract) {
    const html = await deps.fetchHtml(a.url).catch(() => null);
    if (!html || !deps.isOnline()) return fail(deps, a);
    const result = await deps.extract(prepareHtmlForExtraction(html), a.url).catch(() => null);
    if (!result || !result.ok) return fail(deps, a);
    // A refresh fetched outside Safari may hit a paywall teaser; never trade a full save for less.
    if (reextract && meta.status !== 'link_only' && result.wordCount < meta.wordCount * 0.8) return;
    deps.writeContent(a.id, result.html);
    meta = metaFromExtraction(meta, result);
    deps.writeMeta(a.id, meta);
  }

  const done = await completeImages(deps, meta);
  deps.writeMeta(a.id, done);
  const row = articleFromMeta(done, deps.repo.get(a.id), deps.now());
  const imagesStillMissing = done.status !== 'ready';
  deps.repo.upsert({
    ...row,
    retryAttempts: imagesStillMissing ? a.retryAttempts + 1 : 0,
    nextRetryAt: imagesStillMissing ? deps.now() + backoffMs(a.retryAttempts + 1) : null,
  });
  deps.onArticleChanged(a.id);
}

let running = false;

/**
 * Processes the due queue once, sequentially. Stops as soon as the device goes offline.
 * With `onlyId`, retries just that article (ignoring backoff); `reextract` also refreshes ready ones.
 */
export async function runRetryQueue(deps: RetryDeps, onlyId?: string, reextract = false): Promise<void> {
  if (running) return;
  running = true;
  try {
    const queue = onlyId
      ? deps.repo.all().filter((a) => a.id === onlyId && (reextract || a.status !== 'ready'))
      : buildQueue(deps.repo.all(), deps.now());
    for (const a of queue) {
      if (!deps.isOnline()) break;
      await retryOne(deps, a, reextract);
    }
  } finally {
    running = false;
  }
}
