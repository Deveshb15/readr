import type { ArticleMeta } from '../../data/articleMeta';
import { memoryRepo } from '../../data/repo';
import { deleteArticle, ingest, MAX_INGEST_ATTEMPTS } from '../ingest';
import { ID, meta, memoryFs } from './helpers';

const json = (m: ArticleMeta) => JSON.stringify(m);

describe('ingest', () => {
  it('inserts one row per valid inbox marker and removes the markers', () => {
    const ms = [meta(1), meta(2), meta(3)];
    const fs = memoryFs({
      articles: Object.fromEntries(ms.map((m) => [m.id, json(m)])),
      inbox: ms.map((m) => m.id),
    });
    const repo = memoryRepo();
    const r = ingest(fs, repo);
    expect(r.added.map((a) => a.id).sort()).toEqual(ms.map((m) => m.id).sort());
    expect(fs.inbox.size).toBe(0);
    expect(repo.count()).toBe(3);
  });

  it('keeps a marker whose meta is missing, and quarantines it after 3 attempts', () => {
    const fs = memoryFs({ articles: { [ID(9)]: '{"truncated":' }, inbox: [ID(9)] });
    const repo = memoryRepo();
    for (let i = 1; i < MAX_INGEST_ATTEMPTS; i++) {
      const r = ingest(fs, repo);
      expect(r.added).toHaveLength(0);
      expect(fs.inbox.has(ID(9))).toBe(true);
    }
    const last = ingest(fs, repo);
    expect(last.quarantined).toEqual([ID(9)]);
    expect(fs.inbox.has(ID(9))).toBe(false);
    expect(fs.quarantine.has(ID(9))).toBe(true);
    expect(repo.count()).toBe(0);
  });

  it('rejects meta whose id does not match its folder', () => {
    const fs = memoryFs({ articles: { [ID(1)]: json(meta(2)) }, inbox: [ID(1)] });
    const repo = memoryRepo();
    expect(ingest(fs, repo).added).toHaveLength(0);
  });

  it('updates an existing row (images finished later) without duplicating, keeping read state', () => {
    const partial = meta(4, {
      status: 'partial',
      images: [{ index: 0, src: 'https://e.com/a.jpg', file: 'images/0.jpg', width: null, height: null, done: false }],
    });
    const fs = memoryFs({ articles: { [partial.id]: json(partial) }, inbox: [partial.id] });
    const repo = memoryRepo();
    ingest(fs, repo, 1000);
    repo.patch(partial.id, { readAt: 5000, progress: 1 });

    const done = { ...partial, images: [{ ...partial.images[0], done: true }] };
    fs.articles.set(partial.id, json(done));
    fs.inbox.add(partial.id);
    const r = ingest(fs, repo, 2000);

    expect(r.updated.map((a) => a.id)).toEqual([partial.id]);
    expect(repo.count()).toBe(1);
    expect(repo.get(partial.id)).toMatchObject({
      status: 'ready',
      imagesDone: 1,
      readAt: 5000,
      progress: 1,
      updatedAt: 2000,
    });
  });

  it('reconciles all article folders when the database is empty (reinstall, lost markers)', () => {
    const fs = memoryFs({ articles: { [ID(5)]: json(meta(5)), [ID(6)]: json(meta(6)) } });
    const repo = memoryRepo();
    const r = ingest(fs, repo);
    expect(r.added).toHaveLength(2);
  });

  it('does not rescan folders when the database already has rows', () => {
    const fs = memoryFs({ articles: { [ID(5)]: json(meta(5)), [ID(6)]: json(meta(6)) }, inbox: [ID(5)] });
    const repo = memoryRepo();
    ingest(fs, repo);
    expect(repo.count()).toBe(2); // first run reconciles
    fs.articles.set(ID(7), json(meta(7))); // folder without marker
    expect(ingest(fs, repo).added).toHaveLength(0);
  });

  it('covers AE5: reads a folder the extension wrote before the app ever launched', () => {
    const m = meta(8);
    const fs = memoryFs({ articles: { [m.id]: json(m) }, inbox: [m.id] });
    const repo = memoryRepo();
    ingest(fs, repo);
    expect(repo.get(m.id)?.status).toBe('ready');
  });
});

describe('deleteArticle', () => {
  it('removes the row, then the folder', () => {
    const m = meta(1);
    const fs = memoryFs({ articles: { [m.id]: json(m) }, inbox: [m.id] });
    const repo = memoryRepo();
    ingest(fs, repo);
    deleteArticle(fs, repo, m.id);
    expect(repo.get(m.id)).toBeNull();
    expect(fs.articles.has(m.id)).toBe(false);
  });

  it('tombstones when the folder delete fails, and the next ingest cleans it without re-importing', () => {
    const m = meta(2);
    const fs = memoryFs({ articles: { [m.id]: json(m) }, inbox: [m.id] });
    const repo = memoryRepo();
    ingest(fs, repo);
    fs.failRemoves();
    deleteArticle(fs, repo, m.id);
    expect(repo.get(m.id)).toBeNull();
    expect(repo.tombstones()).toEqual([m.id]);

    const fs2 = memoryFs({ articles: { [m.id]: json(m) } });
    const r = ingest(fs2, repo);
    expect(r.removedOrphans).toEqual([m.id]);
    expect(r.added).toHaveLength(0);
    expect(fs2.articles.has(m.id)).toBe(false);
  });
});
