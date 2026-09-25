import { offlineState } from '../../data/article';
import { memoryRepo } from '../../data/repo';
import { buildQueue } from '../retryPlan';
import { ingest } from '../ingest';
import { formatBytes, keepOffline, removeOffline } from '../offline';
import { ID, meta, memoryFs } from './helpers';

function saved(n: number, body: string) {
  const m = meta(n, { title: `Article ${n} about altitude` });
  const fs = memoryFs({ articles: { [m.id]: JSON.stringify(m) }, inbox: [m.id], contents: { [m.id]: `<p>${body}</p>` } });
  const repo = memoryRepo();
  ingest(fs, repo);
  return { fs, repo, id: m.id };
}

describe('search index via ingest', () => {
  it('indexes title and saved body text, so search finds words inside articles', () => {
    const { repo, id } = saved(1, 'The captain turned off the seatbelt sign.');
    expect(repo.search('seatbelt').map((h) => h.id)).toEqual([id]);
    expect(repo.search('altitude').map((h) => h.id)).toEqual([id]);
    expect(repo.search('parachute')).toEqual([]);
  });

  it('backfills articles missing from the index (after the v2 migration)', () => {
    const { fs, repo, id } = saved(2, 'window seat');
    repo.indexText(id, '', '', ''); // simulate stale
    const fresh = memoryRepo(repo.all());
    ingest(fs, fresh);
    expect(fresh.search('window').map((h) => h.id)).toEqual([id]);
  });
});

describe('removeOffline', () => {
  it('frees files, keeps the article, becomes link-only and stops auto re-download', () => {
    const { fs, repo, id } = saved(3, 'Offline text to remove');
    expect(offlineState(repo.get(id)!)).toBe('offline');
    removeOffline(fs, repo, id);
    const a = repo.get(id)!;
    expect(fs.contents.has(id)).toBe(false);
    expect(a).toMatchObject({ status: 'link_only', keepOffline: false });
    expect(offlineState(a)).toBe('removed');
    expect(JSON.parse(fs.articles.get(id)!).status).toBe('link_only');
    expect(buildQueue(repo.all(), Date.now())).toHaveLength(0);
    // title still searchable, body no longer
    expect(repo.search('Article 3').map((h) => h.id)).toEqual([id]);
    expect(repo.search('remove')).toEqual([]);
  });

  it('keepOffline opts back in so the retry engine picks it up', () => {
    const { fs, repo, id } = saved(4, 'x');
    removeOffline(fs, repo, id);
    keepOffline(repo, id);
    expect(buildQueue(repo.all(), Date.now()).map((a) => a.id)).toEqual([ID(4)]);
  });
});

describe('offlineState + formatBytes', () => {
  it('maps status to the badge shown in the UI', () => {
    expect(offlineState({ status: 'partial', keepOffline: true })).toBe('downloading');
    expect(offlineState({ status: 'link_only', keepOffline: true })).toBe('needs-internet');
  });
  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3.4 * 1024 * 1024)).toBe('3.4 MB');
    expect(formatBytes(42 * 1024 * 1024)).toBe('42 MB');
  });
});
