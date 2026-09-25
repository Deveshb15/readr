import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { repo } from '../data/db';
import { useLibraryStore } from '../data/libraryStore';
import { groupFs, groupPaths } from '../data/sharedContainer';
import { invalidateReader } from '../features/reader/prepareReader';
import { isOnlineNow, subscribeOnline } from './connectivity';
import { extractInWebView } from './ExtractorHost';
import { indexArticle, refreshSize } from './offline';
import { runRetryQueue, type RetryDeps } from './retryRunner';

const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

let online = true;

function deps(): RetryDeps {
  const r = repo();
  return {
    repo: r,
    isOnline: () => online,
    now: () => Date.now(),
    readMeta: (id) => groupFs.readMeta(id),
    writeMeta: (id, meta) => groupFs.writeMeta(id, JSON.stringify(meta)),
    writeContent: (id, html) => {
      groupPaths.articleFile(id, 'content.html').write(html);
      invalidateReader(id);
    },
    fetchHtml: async (url) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
        if (!res.ok || !(res.headers.get('content-type') ?? 'text/html').includes('html')) return null;
        return await res.text();
      } finally {
        clearTimeout(t);
      }
    },
    extract: extractInWebView,
    downloadImage: async (id, src, file) => {
      const dest = groupPaths.articleFile(id, file);
      // images/ is gone after "remove from offline"; recreate it before downloading.
      dest.parentDirectory.create({ intermediates: true, idempotent: true });
      if (dest.exists) dest.delete();
      await File.downloadFileAsync(src, dest);
      return dest.exists;
    },
    makeThumbnail: async (id, file) => {
      const source = groupPaths.articleFile(id, file);
      const ref = await ImageManipulator.manipulate(source.uri).resize({ width: 600 }).renderAsync();
      const saved = await ref.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
      const thumb = groupPaths.articleFile(id, 'thumb.jpg');
      if (thumb.exists) thumb.delete();
      new File(saved.uri).moveSync(thumb);
      return true;
    },
    onArticleChanged: (id) => {
      refreshSize(groupFs, r, id);
      const a = r.get(id);
      if (a) indexArticle(groupFs, r, a);
      useLibraryStore.getState().refresh(r);
    },
  };
}

/** Run the due retry queue if online. Safe to call often; it's single-flight. */
export async function retryDue(): Promise<void> {
  online = await isOnlineNow();
  if (online) await runRetryQueue(deps());
}

/** "try again now" from a link-only article, ignoring backoff. */
export async function retryNow(id: string): Promise<void> {
  online = await isOnlineNow();
  if (online) await runRetryQueue(deps(), id);
}

/** Long-press "refresh from the web": re-extract a saved article (e.g. to pick up its hero image). */
export async function refreshArticle(id: string): Promise<boolean> {
  online = await isOnlineNow();
  if (!online) return false;
  await runRetryQueue(deps(), id, true);
  return true;
}

/** Tracks connectivity; kicks the queue when the device comes back online. */
export function startRetryWatcher(): () => void {
  return subscribeOnline((isOnline) => {
    const cameOnline = isOnline && !online;
    online = isOnline;
    if (cameOnline) retryDue().catch(() => {});
  });
}
