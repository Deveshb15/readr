import type { ArticleMeta, ArticleSource, ArticleStatus } from './articleMeta';
import { statusFor } from './articleMeta';

/** A library row. Everything the list needs, nothing the reader needs. */
export type Article = {
  id: string;
  url: string;
  canonicalUrl: string;
  title: string;
  byline: string | null;
  site: string | null;
  excerpt: string | null;
  doodle: number;
  minutes: number;
  wordCount: number;
  status: ArticleStatus;
  source: ArticleSource;
  savedAt: number;
  readAt: number | null;
  progress: number;
  scrollY: number;
  imagesTotal: number;
  imagesDone: number;
  hasThumb: boolean;
  retryAttempts: number;
  nextRetryAt: number | null;
  updatedAt: number;
};

/** Maps extension-written meta onto a row, keeping app-owned fields from any existing row. */
export function articleFromMeta(meta: ArticleMeta, existing: Article | null, now: number): Article {
  const savedAt = Date.parse(meta.savedAt);
  return {
    id: meta.id,
    url: meta.url,
    canonicalUrl: meta.canonicalUrl,
    title: meta.title,
    byline: meta.byline,
    site: meta.site,
    excerpt: meta.excerpt,
    doodle: meta.doodle,
    minutes: meta.minutes,
    wordCount: meta.wordCount,
    status: statusFor(meta),
    source: meta.source,
    savedAt: Number.isNaN(savedAt) ? now : savedAt,
    readAt: existing?.readAt ?? null,
    progress: existing?.progress ?? 0,
    scrollY: existing?.scrollY ?? 0,
    imagesTotal: meta.images.length,
    imagesDone: meta.images.filter((i) => i.done).length,
    hasThumb: meta.hasThumb,
    retryAttempts: existing?.retryAttempts ?? 0,
    nextRetryAt: existing?.nextRetryAt ?? null,
    updatedAt: now,
  };
}
