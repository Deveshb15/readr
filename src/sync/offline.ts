import { hostLabel, type Article } from '../data/article';
import { isArticleMeta } from '../data/articleMeta';
import type { ArticleRepo } from '../data/repo';
import { htmlToText } from '../data/search';
import type { GroupFs } from '../data/sharedContainer';

/** (Re)index an article's title, site (name and domain) and saved text for global search. */
export function indexArticle(fs: GroupFs, repo: ArticleRepo, a: Pick<Article, 'id' | 'title' | 'site' | 'url'>): void {
  const html = fs.readContent(a.id);
  const site = [a.site, hostLabel(a.url)].filter(Boolean).join(' ');
  repo.indexText(a.id, a.title, site, html ? htmlToText(html) : '');
}

/** Bump when htmlToText changes so every article is reindexed once. */
export const INDEX_VERSION = '3';
const INDEX_VERSION_KEY = 'search_index_version';

/**
 * Index any article missing from the search index (or everything, when the index format
 * changed), and size any saved before sizes were tracked (v2 migration).
 */
export function backfillIndex(fs: GroupFs, repo: ArticleRepo): number {
  const stale = repo.getSetting(INDEX_VERSION_KEY) !== INDEX_VERSION;
  const indexed = new Set(stale ? [] : repo.indexedIds());
  let n = 0;
  for (const a of repo.all()) {
    if (a.sizeBytes === 0 && a.status !== 'link_only') refreshSize(fs, repo, a.id);
    if (indexed.has(a.id)) continue;
    indexArticle(fs, repo, a);
    n++;
  }
  if (stale) repo.setSetting(INDEX_VERSION_KEY, INDEX_VERSION);
  return n;
}

/** Keep the stored folder size in sync after files change. */
export function refreshSize(fs: GroupFs, repo: ArticleRepo, id: string): void {
  repo.patch(id, { sizeBytes: fs.articleSize(id) });
}

/**
 * "Remove from offline": free the space but keep the article in the library (title, cover,
 * link). It becomes link-only and the retry engine won't re-download it until asked.
 */
export function removeOffline(fs: GroupFs, repo: ArticleRepo, id: string): void {
  fs.removeOfflineFiles(id);
  const raw = fs.readMeta(id);
  if (raw) {
    try {
      const meta: unknown = JSON.parse(raw);
      if (isArticleMeta(meta)) {
        fs.writeMeta(id, JSON.stringify({ ...meta, status: 'link_only', images: meta.images.map((i) => ({ ...i, done: false })) }));
      }
    } catch {
      // meta unreadable: the row update below still reflects the removal
    }
  }
  repo.patch(id, { status: 'link_only', keepOffline: false, imagesDone: 0, retryAttempts: 0, nextRetryAt: null });
  refreshSize(fs, repo, id);
  const a = repo.get(id);
  if (a) indexArticle(fs, repo, a); // title/site stay searchable; body is gone
}

/** Opt back in to offline; the caller then triggers a re-download (refresh). */
export function keepOffline(repo: ArticleRepo, id: string): void {
  repo.patch(id, { keepOffline: true, retryAttempts: 0, nextRetryAt: null });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
