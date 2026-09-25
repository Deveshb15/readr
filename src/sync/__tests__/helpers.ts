// Shared fixtures for sync tests.
import type { ArticleMeta } from '../../data/articleMeta';
import type { GroupFs } from '../../data/sharedContainer';

export const ID = (n: number) => n.toString(16).padStart(16, '0');

export function meta(n: number, over: Partial<ArticleMeta> = {}): ArticleMeta {
  return {
    schema: 1,
    id: ID(n),
    url: `https://example.com/${n}`,
    canonicalUrl: `https://example.com/${n}`,
    title: `Article ${n}`,
    byline: null,
    site: 'example.com',
    excerpt: null,
    lang: 'en',
    doodle: n % 24,
    minutes: 4,
    wordCount: 900,
    status: 'ready',
    source: 'safari',
    savedAt: new Date(1_700_000_000_000 + n * 1000).toISOString(),
    leadImage: null,
    hasThumb: false,
    images: [],
    ...over,
  };
}

export function memoryFs(opts: { articles?: Record<string, string>; inbox?: string[]; contents?: Record<string, string> } = {}) {
  const articles = new Map(Object.entries(opts.articles ?? {}));
  const contents = new Map(Object.entries(opts.contents ?? {}));
  const inbox = new Set(opts.inbox ?? []);
  const quarantine = new Set<string>();
  let failRemove = false;
  const fs: GroupFs & { inbox: Set<string>; articles: Map<string, string>; contents: Map<string, string>; quarantine: Set<string>; failRemoves: () => void } = {
    inbox,
    articles,
    contents,
    quarantine,
    failRemoves: () => void (failRemove = true),
    listInbox: () => [...inbox],
    removeInbox: (id) => void inbox.delete(id),
    quarantineInbox: (id) => {
      inbox.delete(id);
      quarantine.add(id);
    },
    listArticleIds: () => [...articles.keys()],
    readMeta: (id) => articles.get(id) ?? null,
    writeMeta: (id, json) => void articles.set(id, json),
    removeArticle: (id) => {
      if (failRemove) throw new Error('EPERM');
      articles.delete(id);
    },
    readContent: (id) => contents.get(id) ?? null,
    removeOfflineFiles: (id) => void contents.delete(id),
    articleSize: (id) => (contents.get(id)?.length ?? 0) + (articles.get(id)?.length ?? 0),
  };
  return fs;
}

