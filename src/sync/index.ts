import { repo } from '../data/db';
import { useLibraryStore } from '../data/libraryStore';
import { groupFs } from '../data/sharedContainer';
import { deleteArticle, ingest, type IngestResult } from './ingest';

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
