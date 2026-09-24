import type { Article } from '../data/article';
import type { ArticleMeta, MetaImage } from '../data/articleMeta';
import type { ExtractSuccess } from '../extract/extract';

export const MAX_RETRY_ATTEMPTS = 5;
const BACKOFF_MS = [60_000, 10 * 60_000, 60 * 60_000];

export function backoffMs(attempts: number): number {
  return BACKOFF_MS[Math.min(Math.max(attempts, 1), BACKOFF_MS.length) - 1];
}

/** Link-only before partial (text matters more than images); newest first within a status. */
export function buildQueue(articles: Article[], now: number): Article[] {
  const due = articles.filter(
    (a) =>
      a.status !== 'ready' &&
      a.retryAttempts < MAX_RETRY_ATTEMPTS &&
      (a.nextRetryAt === null || a.nextRetryAt <= now),
  );
  const rank = (a: Article) => (a.status === 'link_only' ? 0 : 1);
  return due.sort((a, b) => rank(a) - rank(b) || b.savedAt - a.savedAt);
}

/**
 * The web view never loads page scripts or subresources during extraction:
 * scripts/iframes/stylesheets are stripped and img src/srcset become data-*,
 * which the extractor's image normaliser promotes back.
 */
export function prepareHtmlForExtraction(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '')
    .replace(/<(img|source)\b([^>]*)>/gi, (_m, tag: string, attrs: string) =>
      `<${tag}${attrs.replace(/\s(src|srcset)=/gi, (_a, name: string) => ` data-${name.toLowerCase()}=`)}>`,
    );
}

/** New meta after a successful retry extraction of a link-only save. */
export function metaFromExtraction(prev: ArticleMeta, x: ExtractSuccess): ArticleMeta {
  const images: MetaImage[] = x.images.map((i) => ({ ...i, done: false }));
  return {
    ...prev,
    title: x.title || prev.title,
    byline: x.byline,
    site: x.siteName ?? prev.site,
    excerpt: x.excerpt,
    lang: x.lang,
    minutes: x.minutes,
    wordCount: x.wordCount,
    leadImage: x.leadImage,
    images,
    status: images.length ? 'partial' : 'ready',
  };
}
