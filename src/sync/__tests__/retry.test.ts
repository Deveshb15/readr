import type { Article } from '../../data/article';
import type { ArticleMeta } from '../../data/articleMeta';
import { memoryRepo } from '../../data/repo';
import type { ExtractResult } from '../../extract/extract';
import { flightCopy, flightStatus } from '../../features/library/selectors';
import { buildQueue, MAX_RETRY_ATTEMPTS, prepareHtmlForExtraction } from '../retryPlan';
import { runRetryQueue, type RetryDeps } from '../retryRunner';

const NOW = 1_800_000_000_000;
const ID = (n: number) => n.toString(16).padStart(16, '0');

function article(n: number, over: Partial<Article> = {}): Article {
  return {
    id: ID(n),
    url: `https://e.com/${n}`,
    canonicalUrl: `https://e.com/${n}`,
    title: `t${n}`,
    byline: null,
    site: 'e.com',
    excerpt: null,
    doodle: 0,
    minutes: 0,
    wordCount: 0,
    status: 'link_only',
    source: 'share',
    savedAt: NOW - n * 1000,
    readAt: null,
    progress: 0,
    scrollY: 0,
    imagesTotal: 0,
    imagesDone: 0,
    hasThumb: false,
    retryAttempts: 0,
    nextRetryAt: null,
    updatedAt: 0,
    ...over,
  };
}

function metaFor(a: Article, over: Partial<ArticleMeta> = {}): ArticleMeta {
  return {
    schema: 1,
    id: a.id,
    url: a.url,
    canonicalUrl: a.canonicalUrl,
    title: a.title,
    byline: null,
    site: a.site,
    excerpt: null,
    lang: null,
    doodle: 0,
    minutes: 0,
    wordCount: 0,
    status: a.status,
    source: a.source,
    savedAt: new Date(a.savedAt).toISOString(),
    leadImage: null,
    hasThumb: false,
    images: [],
    ...over,
  };
}

const img = (i: number, done = false) => ({
  index: i,
  src: `https://e.com/i${i}.jpg`,
  file: `images/${i}.jpg`,
  width: null,
  height: null,
  done,
});

function harness(articles: Article[], metas: ArticleMeta[], opts: Partial<RetryDeps> = {}) {
  const repo = memoryRepo(articles);
  const stored = new Map(metas.map((m) => [m.id, JSON.stringify(m)]));
  const content = new Map<string, string>();
  let online = true;
  const deps: RetryDeps = {
    repo,
    isOnline: () => online,
    now: () => NOW,
    readMeta: (id) => stored.get(id) ?? null,
    writeMeta: (id, m) => void stored.set(id, JSON.stringify(m)),
    writeContent: (id, html) => void content.set(id, html),
    fetchHtml: async () => '<html><body><article>ok</article></body></html>',
    extract: async (_html, url): Promise<ExtractResult> => ({
      ok: true,
      url,
      canonical: null,
      title: 'Recovered',
      byline: null,
      siteName: 'e.com',
      excerpt: null,
      lang: 'en',
      html: '<p>ok</p><img src="images/0.jpg">',
      images: [{ index: 0, src: 'https://e.com/i0.jpg', file: 'images/0.jpg', width: null, height: null }],
      leadImage: 'https://e.com/i0.jpg',
      wordCount: 600,
      minutes: 3,
    }),
    downloadImage: async () => true,
    makeThumbnail: async () => true,
    onArticleChanged: jest.fn(),
    ...opts,
  };
  return {
    repo,
    deps,
    stored,
    content,
    goOffline: () => void (online = false),
    meta: (id: string) => JSON.parse(stored.get(id)!) as ArticleMeta,
  };
}

describe('buildQueue', () => {
  it('runs link-only before partial, newest first within a status', () => {
    const q = buildQueue(
      [
        article(1, { status: 'partial', savedAt: NOW }),
        article(2, { status: 'link_only', savedAt: NOW - 86_400_000 }),
        article(3, { status: 'link_only', savedAt: NOW - 1000 }),
        article(4, { status: 'ready' }),
      ],
      NOW,
    );
    expect(q.map((a) => a.id)).toEqual([ID(3), ID(2), ID(1)]);
  });

  it('skips items in backoff or past the attempt cap', () => {
    const q = buildQueue(
      [article(1, { nextRetryAt: NOW + 1 }), article(2, { retryAttempts: MAX_RETRY_ATTEMPTS }), article(3)],
      NOW,
    );
    expect(q.map((a) => a.id)).toEqual([ID(3)]);
  });
});

describe('prepareHtmlForExtraction', () => {
  it('strips scripts/iframes/stylesheets and neutralises image loads', () => {
    const out = prepareHtmlForExtraction(
      '<link rel="stylesheet" href="a.css"><script>x()</script><iframe src="ad"></iframe><img src="/a.jpg" srcset="/a.jpg 1x"><picture><source srcset="/b.avif"></picture>',
    );
    expect(out).not.toMatch(/<script|<iframe|stylesheet/);
    expect(out).toContain('<img data-src="/a.jpg" data-srcset="/a.jpg 1x">');
    expect(out).toContain('<source data-srcset="/b.avif">');
  });
});

describe('runRetryQueue', () => {
  it('covers AE4: link-only → extracted → images done → ready; flight status flips to all set', async () => {
    const a = article(1);
    const h = harness([a], [metaFor(a)]);
    expect(flightCopy(flightStatus(h.repo.all()))).toBe('1 not ready offline');
    await runRetryQueue(h.deps);
    const row = h.repo.get(a.id)!;
    expect(row).toMatchObject({ status: 'ready', title: 'Recovered', minutes: 3, imagesDone: 1, hasThumb: true, retryAttempts: 0 });
    expect(h.content.get(a.id)).toContain('images/0.jpg');
    expect(flightCopy(flightStatus(h.repo.all()))).toBe('all set for your flight');
    expect(h.deps.onArticleChanged).toHaveBeenCalled();
  });

  it('keeps link-only with backoff when extraction fails', async () => {
    const a = article(1);
    const h = harness([a], [metaFor(a)], {
      extract: async (_h, url) => ({ ok: false, url, reason: 'not-article', canonical: null, title: null }),
    });
    await runRetryQueue(h.deps);
    expect(h.repo.get(a.id)).toMatchObject({ status: 'link_only', retryAttempts: 1, nextRetryAt: NOW + 60_000 });
  });

  it('a 404 image fails alone; the article stays partial and other images complete', async () => {
    const a = article(1, { status: 'partial' });
    const h = harness([a], [metaFor(a, { status: 'partial', images: [img(0), img(1), img(2)] })], {
      downloadImage: async (_id, src) => !src.endsWith('i1.jpg'),
    });
    await runRetryQueue(h.deps);
    const m = h.meta(a.id);
    expect(m.images.map((i) => i.done)).toEqual([true, false, true]);
    expect(h.repo.get(a.id)).toMatchObject({ status: 'partial', imagesDone: 2, retryAttempts: 1 });
  });

  it('going offline mid-queue stops further work and does not count in-flight images', async () => {
    const a = article(1, { status: 'partial' });
    const b = article(2, { status: 'partial' });
    let h: ReturnType<typeof harness>;
    h = harness([a, b], [metaFor(a, { status: 'partial', images: [img(0)] }), metaFor(b, { status: 'partial', images: [img(0)] })], {
      downloadImage: async () => {
        h.goOffline();
        return true;
      },
    });
    await runRetryQueue(h.deps);
    expect(h.meta(a.id).images[0].done).toBe(false);
    expect(h.repo.get(b.id)?.retryAttempts).toBe(0); // never attempted
  });

  it('refresh re-extracts a ready article (picks up a hero image)', async () => {
    const a = article(1, { status: 'ready', wordCount: 500 });
    const h = harness([a], [metaFor(a, { status: 'ready', wordCount: 500 })]);
    await runRetryQueue(h.deps, a.id, true);
    expect(h.content.get(a.id)).toContain('images/0.jpg');
    expect(h.repo.get(a.id)).toMatchObject({ status: 'ready', title: 'Recovered', hasThumb: true });
  });

  it('refresh never replaces a full save with a shorter (paywalled) version', async () => {
    const a = article(1, { status: 'ready', wordCount: 3000 });
    const h = harness([a], [metaFor(a, { status: 'ready', wordCount: 3000, title: 'Full article' })]);
    await runRetryQueue(h.deps, a.id, true);
    expect(h.content.has(a.id)).toBe(false);
    expect(h.meta(a.id).title).toBe('Full article');
  });

  it('retryNow targets one item even if it is in backoff', async () => {
    const a = article(1, { nextRetryAt: NOW + 3_600_000, retryAttempts: 2 });
    const h = harness([a], [metaFor(a)]);
    await runRetryQueue(h.deps, a.id);
    expect(h.repo.get(a.id)?.status).toBe('ready');
  });
});
