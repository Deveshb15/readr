import { articleFromMeta } from '../article';
import type { ArticleMeta } from '../articleMeta';
import { isArticleMeta } from '../articleMeta';
import { migrate } from '../migrations';

function fakeDb() {
  let version = 0;
  const executed: string[] = [];
  return {
    executed,
    version: () => version,
    execSync(sql: string) {
      executed.push(sql);
      const m = /PRAGMA user_version = (\d+)/.exec(sql);
      if (m) version = +m[1];
    },
    getFirstSync<T>(sql: string): T | null {
      return (sql.includes('user_version') ? { user_version: version } : null) as T | null;
    },
    withTransactionSync(task: () => void) {
      task();
    },
  };
}

describe('migrate', () => {
  it('brings a fresh database to the latest version', () => {
    const db = fakeDb();
    migrate(db);
    expect(db.version()).toBe(2);
    expect(db.executed.some((s) => s.includes('CREATE TABLE articles'))).toBe(true);
    expect(db.executed.some((s) => s.includes('USING fts5'))).toBe(true);
  });

  it('is a no-op when already migrated', () => {
    const db = fakeDb();
    migrate(db);
    const count = db.executed.length;
    migrate(db);
    expect(db.executed.length).toBe(count);
  });
});

const baseMeta: ArticleMeta = {
  schema: 1,
  id: '00000000000000aa',
  url: 'https://e.com/a',
  canonicalUrl: 'https://e.com/a',
  title: 'A',
  byline: null,
  site: 'e.com',
  excerpt: null,
  lang: null,
  doodle: 3,
  minutes: 2,
  wordCount: 400,
  status: 'partial',
  source: 'share',
  savedAt: '2026-09-24T10:00:00.000Z',
  leadImage: null,
  hasThumb: true,
  images: [
    { index: 0, src: 'https://e.com/0.jpg', file: 'images/0.jpg', width: null, height: null, done: true },
    { index: 1, src: 'https://e.com/1.jpg', file: 'images/1.jpg', width: null, height: null, done: false },
  ],
};

describe('articleFromMeta', () => {
  it('derives status and image counts from the manifest', () => {
    const a = articleFromMeta(baseMeta, null, 1);
    expect(a).toMatchObject({ status: 'partial', imagesTotal: 2, imagesDone: 1, savedAt: Date.parse(baseMeta.savedAt) });
  });

  it('keeps link_only regardless of images', () => {
    expect(articleFromMeta({ ...baseMeta, status: 'link_only', images: [] }, null, 1).status).toBe('link_only');
  });
});

describe('isArticleMeta', () => {
  it('accepts valid meta and rejects malformed ids or statuses', () => {
    expect(isArticleMeta(baseMeta)).toBe(true);
    expect(isArticleMeta({ ...baseMeta, id: '../../etc' })).toBe(false);
    expect(isArticleMeta({ ...baseMeta, status: 'weird' })).toBe(false);
    expect(isArticleMeta(null)).toBe(false);
  });
});
