import { offlineState, type OfflineState } from '../data/article';
import { repo } from '../data/db';
import { useLibraryStore } from '../data/libraryStore';
import { groupFs } from '../data/sharedContainer';
import { deleteArticle, ingest, type IngestResult } from './ingest';
import { keepOffline, removeOffline } from './offline';
import { refreshArticle } from './retry';

type Listener = (result: IngestResult) => void;
const listeners = new Set<Listener>();

/** Subscribe to ingest results (e.g. first-Safari-save detection, practice save). */
export function onIngest(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Pulls new extension saves into the DB and the library store. Cheap; call on launch and foreground. */
export function syncNow(): IngestResult {
  const r = repo();
  const result = ingest(groupFs, r);
  if (result.added.length || result.updated.length || result.removedOrphans.length) {
    useLibraryStore.getState().refresh(
      r,
      result.added.map((a) => a.id),
    );
  }
  for (const l of listeners) l(result);
  return result;
}

export function removeArticle(id: string): void {
  const r = repo();
  deleteArticle(groupFs, r, id);
  useLibraryStore.getState().refresh(r);
}

/** Frees an article's offline copy (text + images) but keeps it in the library. */
export function removeFromOffline(id: string): void {
  const r = repo();
  removeOffline(groupFs, r, id);
  useLibraryStore.getState().refresh(r);
}

/**
 * Opt an article back into offline and re-download it. Resolves with where it ended up
 * ('offline', or 'downloading' when some images are still missing), or null without internet.
 */
export async function downloadForOffline(id: string): Promise<OfflineState | null> {
  const r = repo();
  keepOffline(r, id);
  useLibraryStore.getState().refresh(r);
  if (!(await refreshArticle(id))) return null;
  const a = r.get(id);
  return a ? offlineState(a) : null;
}

/** Toast copy for a finished downloadForOffline. */
export function downloadResultCopy(state: OfflineState | null): string {
  if (state === 'offline') return 'saved offline';
  if (state === 'downloading') return 'text saved · images will finish in the background';
  if (state === null) return 'needs internet to download';
  return "couldn't download this page";
}
