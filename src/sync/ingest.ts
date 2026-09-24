import { articleFromMeta, type Article } from '../data/article';
import { isArticleMeta, type ArticleMeta } from '../data/articleMeta';
import type { ArticleRepo } from '../data/repo';
import type { GroupFs } from '../data/sharedContainer';

export const MAX_INGEST_ATTEMPTS = 3;

export type IngestResult = {
  added: Article[];
  updated: Article[];
  quarantined: string[];
  removedOrphans: string[];
};

function readMeta(fs: GroupFs, id: string): ArticleMeta | null {
  const raw = fs.readMeta(id);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isArticleMeta(parsed) && parsed.id === id ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Mirrors extension-written articles into the app database.
 * - Normal path: process `inbox/` markers (cheap; no directory scan).
 * - Reconcile path (empty DB, e.g. reinstall with surviving App Group): scan `articles/`.
 * Tombstoned folders (delete whose folder removal failed) are cleaned up, never re-imported.
 */
export function ingest(fs: GroupFs, repo: ArticleRepo, now = Date.now()): IngestResult {
  const result: IngestResult = { added: [], updated: [], quarantined: [], removedOrphans: [] };
  const tombstones = new Set(repo.tombstones());
  const wasEmpty = repo.count() === 0;

  for (const id of tombstones) {
    try {
      fs.removeArticle(id);
      fs.removeInbox(id);
      repo.clearTombstone(id);
      result.removedOrphans.push(id);
    } catch {
      // Keep the tombstone; try again next launch.
    }
  }

  const upsert = (meta: ArticleMeta) => {
    const existing = repo.get(meta.id);
    const row = articleFromMeta(meta, existing, now);
    repo.upsert(row);
    (existing ? result.updated : result.added).push(row);
  };

  for (const id of fs.listInbox()) {
    if (tombstones.has(id)) continue;
    const meta = readMeta(fs, id);
    if (!meta) {
      const attempts = repo.recordIngestFailure(id);
      if (attempts >= MAX_INGEST_ATTEMPTS) {
        fs.quarantineInbox(id);
        repo.clearIngestFailure(id);
        result.quarantined.push(id);
      }
      continue;
    }
    upsert(meta);
    fs.removeInbox(id);
    repo.clearIngestFailure(id);
  }

  if (wasEmpty) {
    for (const id of fs.listArticleIds()) {
      if (tombstones.has(id) || repo.get(id)) continue;
      const meta = readMeta(fs, id);
      if (meta) upsert(meta);
    }
  }

  return result;
}

/** Delete: row first (UI never points at a missing folder), then folder; tombstone if that fails. */
export function deleteArticle(fs: GroupFs, repo: ArticleRepo, id: string): void {
  repo.remove(id);
  try {
    fs.removeArticle(id);
    fs.removeInbox(id);
  } catch {
    repo.addTombstone(id);
  }
}
