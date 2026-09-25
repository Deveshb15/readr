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
  /** False when the user removed the offline copy; the retry engine leaves it alone. */
  keepOffline: boolean;
  /** Bytes on disk for this article's folder (text + images). */
  sizeBytes: number;
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
    keepOffline: existing?.keepOffline ?? true,
    sizeBytes: existing?.sizeBytes ?? 0,
    updatedAt: now,
  };
}

/** What the offline badge / Saved offline screen shows for an article. */
export type OfflineState = 'offline' | 'downloading' | 'needs-internet' | 'removed';

export function offlineState(a: Pick<Article, 'status' | 'keepOffline'>): OfflineState {
  if (!a.keepOffline) return 'removed';
  if (a.status === 'ready') return 'offline';
  if (a.status === 'partial') return 'downloading';
  return 'needs-internet';
}

/** Domain without "www." / mobile / language prefixes: "en.m.wikipedia.org" → "wikipedia.org". */
export function hostLabel(url: string): string {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(url);
  if (!m) return url;
  const labels = m[1].toLowerCase().split('.');
  while (labels.length > 2 && /^(www\d?|m|mobile|amp|[a-z]{2})$/.test(labels[0])) labels.shift();
  return labels.join('.');
}

/**
 * The site name people know: the publisher's name unless it's a legal or long corporate
 * name ("Wikimedia Foundation, Inc."), in which case the domain.
 */
export function siteLabel(a: Pick<Article, 'site' | 'url'>): string {
  const s = a.site?.trim();
  if (s && s.length <= 28 && !/,|\b(inc|llc|ltd|gmbh|foundation|corporation|corp|plc)\b/i.test(s)) return s;
  return hostLabel(a.url);
}
