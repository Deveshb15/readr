import { siteLabel, type Article } from '../../../data/article';
import { flightCopy, flightStatus, groupLibrary, relativeSaved, rowMeta, shelfDots } from '../selectors';

// Local-time dates so month boundaries don't depend on the machine's timezone.
const NOW = new Date(2026, 8, 24, 12);

function article(id: string, over: Partial<Article> = {}): Article {
  return {
    id,
    url: `https://www.example.com/${id}`,
    canonicalUrl: `https://example.com/${id}`,
    title: id,
    byline: null,
    site: 'example.com',
    excerpt: null,
    doodle: 1,
    minutes: 5,
    wordCount: 1000,
    status: 'ready',
    source: 'safari',
    savedAt: NOW.getTime(),
    readAt: null,
    progress: 0,
    scrollY: 0,
    imagesTotal: 0,
    imagesDone: 0,
    hasThumb: false,
    retryAttempts: 0,
    nextRetryAt: null,
    keepOffline: true,
    sizeBytes: 0,
    updatedAt: 0,
    ...over,
  };
}

describe('groupLibrary', () => {
  it('splits unread (newest first) from read', () => {
    const a = [
      article('u1', { savedAt: 1 }),
      article('r1', { readAt: 10 }),
      article('u2', { savedAt: 3 }),
      article('u3', { savedAt: 2 }),
      article('r2', { readAt: 20 }),
    ];
    const g = groupLibrary(a);
    expect(g.unread.map((x) => x.id)).toEqual(['u2', 'u3', 'u1']);
    expect(g.read.map((x) => x.id)).toEqual(['r2', 'r1']);
  });

  it('covers AE6: marking read moves the article and turns its shelf dot into a doodle', () => {
    const before = [article('a', { doodle: 7 })];
    expect(groupLibrary(before).unread).toHaveLength(1);
    expect(shelfDots(before, NOW)[0]).toEqual({ id: 'a', doodle: 7, read: false });
    const after = [article('a', { doodle: 7, readAt: NOW.getTime() })];
    expect(groupLibrary(after).read).toHaveLength(1);
    expect(shelfDots(after, NOW)[0].read).toBe(true);
  });
});

describe('shelfDots', () => {
  it('includes only this month, oldest first', () => {
    const dots = shelfDots(
      [
        article('last-month', { savedAt: new Date(2026, 7, 31, 10).getTime() }),
        article('b', { savedAt: new Date(2026, 8, 10, 10).getTime() }),
        article('a', { savedAt: new Date(2026, 8, 2, 10).getTime() }),
      ],
      NOW,
    );
    expect(dots.map((d) => d.id)).toEqual(['a', 'b']);
  });
});

describe('flightStatus', () => {
  it('covers AE4: one partial + one link-only → "02 not ready offline"', () => {
    const s = flightStatus([article('a', { status: 'partial' }), article('b', { status: 'link_only' }), article('c')]);
    expect(s).toEqual({ kind: 'notReady', count: 2 });
    expect(flightCopy(s)).toBe('2 not ready offline'); // rendered as "02" by InkNumbers
  });

  it('covers AE4: all ready → "all set for your flight"', () => {
    expect(flightCopy(flightStatus([article('a'), article('b', { readAt: 1 })]))).toBe('all set for your flight');
  });

  it('counts read items that are not fully offline', () => {
    expect(flightStatus([article('a', { status: 'partial', readAt: 1 })])).toEqual({ kind: 'notReady', count: 1 });
  });

  it('shows nothing for an empty library', () => {
    expect(flightCopy(flightStatus([]))).toBeNull();
  });
});

describe('row meta', () => {
  const now = NOW.getTime();
  it('formats relative save times', () => {
    expect(relativeSaved(now - 20_000, now)).toBe('saved just now');
    expect(relativeSaved(now - 5 * 60_000, now)).toBe('saved 5m ago');
    expect(relativeSaved(now - 2 * 3_600_000, now)).toBe('saved 2h ago');
    expect(relativeSaved(now - 3 * 86_400_000, now)).toBe('saved 3d ago');
  });

  it('omits minutes for link-only items and falls back to host', () => {
    expect(rowMeta(article('x', { status: 'link_only', site: null }), now)).toBe('example.com · saved just now');
    expect(rowMeta(article('y'), now)).toBe('example.com · 5 min · saved just now');
  });
});

describe('siteLabel', () => {
  it('keeps short publisher names and falls back to the domain for legal names', () => {
    expect(siteLabel({ site: 'The Verge', url: 'https://www.theverge.com/x' })).toBe('The Verge');
    expect(siteLabel({ site: 'Wikimedia Foundation, Inc.', url: 'https://en.m.wikipedia.org/wiki/Reading' })).toBe('wikipedia.org');
    expect(siteLabel({ site: null, url: 'https://www.example.co/a' })).toBe('example.co');
  });
});
