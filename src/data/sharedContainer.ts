import { Directory, File, Paths } from 'expo-file-system';

// App Group layout shared with the share extension (targets/share/GroupStore.swift):
//   articles/<id>/meta.json · content.html · reader.html · images/ · thumb.jpg
//   inbox/<id>            marker written last by the extension
//   inbox-quarantine/<id> markers that failed ingest 3 times
//   reader-assets/        reader.css + fonts (seeded by the app)
//   samples/welcome/      practice article (seeded by the app)

export const APP_GROUP = 'group.com.devesh.readr';

/** File-system operations ingest/retry need. Tests supply an in-memory version. */
export interface GroupFs {
  listInbox(): string[];
  removeInbox(id: string): void;
  quarantineInbox(id: string): void;
  listArticleIds(): string[];
  readMeta(id: string): string | null;
  writeMeta(id: string, json: string): void;
  removeArticle(id: string): void;
}

export function groupRoot(): Directory {
  const dir = Paths.appleSharedContainers[APP_GROUP];
  if (!dir) throw new Error(`App Group ${APP_GROUP} is not available (check entitlements).`);
  return dir;
}

export const groupPaths = {
  articles: () => new Directory(groupRoot(), 'articles'),
  article: (id: string) => new Directory(groupRoot(), 'articles', id),
  articleFile: (id: string, name: string) => new File(groupRoot(), 'articles', id, name),
  inbox: () => new Directory(groupRoot(), 'inbox'),
  quarantine: () => new Directory(groupRoot(), 'inbox-quarantine'),
  readerAssets: () => new Directory(groupRoot(), 'reader-assets'),
  samples: () => new Directory(groupRoot(), 'samples'),
};

function ensure(dir: Directory): Directory {
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

const ID_RE = /^[0-9a-f]{16}$/;

export const groupFs: GroupFs = {
  listInbox() {
    const inbox = groupPaths.inbox();
    if (!inbox.exists) return [];
    return inbox
      .list()
      .filter((e): e is File => e instanceof File)
      .map((f) => f.name)
      .filter((n) => ID_RE.test(n));
  },
  removeInbox(id) {
    const f = new File(groupPaths.inbox(), id);
    if (f.exists) f.delete();
  },
  quarantineInbox(id) {
    const f = new File(groupPaths.inbox(), id);
    if (f.exists) f.moveSync(new File(ensure(groupPaths.quarantine()), id));
  },
  listArticleIds() {
    const dir = groupPaths.articles();
    if (!dir.exists) return [];
    return dir
      .list()
      .filter((e): e is Directory => e instanceof Directory)
      .map((d) => d.name)
      .filter((n) => ID_RE.test(n));
  },
  readMeta(id) {
    const f = groupPaths.articleFile(id, 'meta.json');
    return f.exists ? f.textSync() : null;
  },
  writeMeta(id, json) {
    groupPaths.articleFile(id, 'meta.json').write(json);
  },
  removeArticle(id) {
    const d = groupPaths.article(id);
    if (d.exists) d.delete();
  },
};

/** file:// URI of an article folder (reader web view base). */
export function articleUri(id: string): string {
  return groupPaths.article(id).uri;
}

export function groupRootUri(): string {
  return groupRoot().uri;
}

export { ensure as ensureDirectory };
