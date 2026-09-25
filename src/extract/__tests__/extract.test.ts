/**
 * Fixtures are the contract for all three runtimes (Safari page, extension web view, app retry web view).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

import { cleanTitle, extract, type ExtractSuccess } from '../extract';
import { extensionFor, pickFromSrcset } from '../images';

function load(name: string, url: string) {
  const html = readFileSync(join(__dirname, '../__fixtures__', name), 'utf8');
  return new JSDOM(html, { url }).window.document;
}

function ok(result: ReturnType<typeof extract>): ExtractSuccess {
  if (!result.ok) throw new Error(`expected success, got ${result.reason}`);
  return result;
}

describe('extract: blog with lazy images', () => {
  const url = 'https://fieldnotes.example.com/2026/reading-at-altitude?utm_source=x';
  const r = ok(extract(load('blog-lazy.html', url), url));

  it('returns article metadata', () => {
    expect(r.title).toMatch(/Reading at altitude/);
    expect(r.siteName).toBe('Field Notes');
    expect(r.canonical).toBe('https://fieldnotes.example.com/2026/reading-at-altitude');
    expect(r.wordCount).toBeGreaterThan(300);
    expect(r.minutes).toBeGreaterThanOrEqual(1);
  });

  it('promotes data-src / data-lazy-src and rewrites images to local files', () => {
    const srcs = r.images.map((i) => i.src);
    expect(srcs).toContain('https://fieldnotes.example.com/img/wing.jpg');
    expect(srcs).toContain('https://cdn.example.com/img/seat.png');
    expect(r.html).toContain('src="images/0.jpg"');
    expect(r.html).not.toMatch(/src="data:/);
    expect(r.images.find((i) => i.src.endsWith('/img/wing.jpg'))).toMatchObject({ width: 1200, height: 800 });
  });

  it('picks the widest srcset candidate within 1400w', () => {
    expect(r.images.map((i) => i.src)).toContain('https://fieldnotes.example.com/img/map-1200.webp');
  });

  it('strips scripts, iframes and chrome but keeps figure/figcaption/blockquote', () => {
    expect(r.html).not.toMatch(/<script|<iframe|tracker/);
    expect(r.html).toContain('<figcaption>');
    expect(r.html).toContain('<blockquote>');
    expect(r.html).not.toContain('Copyright Field Notes');
  });

  it('absolutises links and drops class/style attributes', () => {
    expect(r.html).toContain('href="https://fieldnotes.example.com/2026/next"');
    expect(r.html).not.toMatch(/class=|style=/);
  });

  it('puts the og:image hero first (reader hero + book cover) when the body lacks it', () => {
    expect(r.leadImage).toBe('https://fieldnotes.example.com/og/altitude.jpg');
    expect(r.images[0]).toMatchObject({ src: 'https://fieldnotes.example.com/og/altitude.jpg', file: 'images/0.jpg' });
    expect(r.html.indexOf('data-hero')).toBeLessThan(r.html.indexOf('wing'));
  });
});

describe('extract: paywalled page with the full DOM present (Safari capture)', () => {
  it('saves the full body, not the teaser', () => {
    const url = 'https://ledger.example.com/seats';
    const r = ok(extract(load('paywall-full-dom.html', url), url));
    expect(r.html).toContain('FINAL-PARAGRAPH-MARKER');
    expect(r.html).not.toContain('Subscribe to continue');
  });
});

describe('extract: app shell / tweet-like page', () => {
  it('fails so the save becomes link-only, keeping a fallback title', () => {
    const url = 'https://x.com/someone/status/1';
    const r = extract(load('app-shell.html', url), url);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(['not-article', 'too-short']).toContain(r.reason);
      expect(r.title).toBe('Someone on X: a short post');
    }
  });
});

describe('extract: picture, duplicates, noscript', () => {
  const url = 'https://pics.example.com/p';
  const r = ok(extract(load('picture-noscript.html', url), url));

  it('uses <picture><source srcset> within the width cap', () => {
    expect(r.images.map((i) => i.src)).toContain('https://img.example.com/a-800.avif');
  });

  it('dedupes repeated images to one file', () => {
    const b = r.images.filter((i) => i.src === 'https://img.example.com/b.jpg?w=900');
    expect(b).toHaveLength(1);
    expect(r.html.match(new RegExp(`src="${b[0].file}"`, 'g'))).toHaveLength(2);
  });

  it('recovers <noscript> image fallbacks', () => {
    expect(r.images.map((i) => i.src)).toContain('https://img.example.com/c.jpg');
  });

  it('does not mutate the live document', () => {
    const doc = load('picture-noscript.html', url);
    const before = doc.documentElement.outerHTML;
    extract(doc, url);
    expect(doc.documentElement.outerHTML).toBe(before);
  });
});

describe('extract: Wikipedia-style collapsed sections, tracking pixels, hero already inline', () => {
  const url = 'https://en.m.wikipedia.org/wiki/Reading';
  const r = ok(extract(load('wiki-collapsed.html', url), url));

  it('keeps hidden="until-found" sections (mobile Wikipedia collapses them)', () => {
    expect(r.html).toContain('COLLAPSED-SECTION-MARKER');
  });

  it('drops 1x1 tracking pixels', () => {
    expect(r.images.map((i) => i.src).join(' ')).not.toContain('CentralAutoLogin');
  });

  it('does not duplicate the hero when og:image is already in the body (query strings ignored)', () => {
    expect(r.images).toHaveLength(1);
    expect(r.html).not.toContain('data-hero');
    expect(r.leadImage).toBe(r.images[0].src);
  });
});

describe('image helpers', () => {
  it('pickFromSrcset falls back to the smallest candidate above the cap', () => {
    expect(pickFromSrcset('/a-2000.jpg 2000w, /a-3000.jpg 3000w', 'https://e.com/')).toBe('https://e.com/a-2000.jpg');
  });
  it('pickFromSrcset prefers the highest density for x descriptors', () => {
    expect(pickFromSrcset('/a.jpg 1x, /a@2x.jpg 2x', 'https://e.com/')).toBe('https://e.com/a@2x.jpg');
  });
  it('extensionFor normalises jpeg and defaults to jpg', () => {
    expect(extensionFor('https://e.com/a.JPEG?w=1')).toBe('jpg');
    expect(extensionFor('https://e.com/image?id=3')).toBe('jpg');
    expect(extensionFor('https://e.com/a.webp')).toBe('webp');
  });
});

describe('cleanTitle', () => {
  it('drops a trailing site name matching the domain or site name', () => {
    expect(cleanTitle('Reading - Wikipedia', 'Wikimedia Foundation, Inc.', 'https://en.wikipedia.org/wiki/Reading')).toBe('Reading');
    expect(cleanTitle('Why we sleep | The Verge', 'The Verge', 'https://example.com/a')).toBe('Why we sleep');
  });
  it('keeps subtitles and titles without a site suffix', () => {
    expect(cleanTitle('Dune: Part Two - a review', null, 'https://blog.example.com/x')).toBe('Dune: Part Two - a review');
    expect(cleanTitle('Plain title', 'Site', 'https://site.com')).toBe('Plain title');
  });
});
