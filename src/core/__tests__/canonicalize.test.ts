import { canonicalize, findUrlInText, InvalidUrlError, parseHttpUrl } from '../canonicalize';
import { identify, identifyJSON, PRACTICE_URL } from '../index';

describe('canonicalize', () => {
  it('lowercases host, strips www, fragment, tracking params, sorts the rest', () => {
    expect(canonicalize('https://www.Example.com/a/?utm_source=x&b=2&a=1#top')).toBe(
      'https://example.com/a?a=1&b=2',
    );
  });

  it('keeps the root slash and drops default ports', () => {
    expect(canonicalize('https://example.com:443')).toBe('https://example.com/');
    expect(canonicalize('http://example.com:80/')).toBe('http://example.com/');
    expect(canonicalize('https://example.com:8443/x')).toBe('https://example.com:8443/x');
  });

  it('strips userinfo and collapses duplicate slashes', () => {
    expect(canonicalize('https://user:pw@example.com//a//b/')).toBe('https://example.com/a/b');
  });

  it('removes common share-tracking params (NYT, Instagram, Spotify)', () => {
    expect(canonicalize('https://www.nytimes.com/2026/09/20/tech/story.html?smid=nytcore-ios-share&referringSource=articleShare')).toBe(
      'https://nytimes.com/2026/09/20/tech/story.html?referringSource=articleShare',
    );
    expect(canonicalize('https://example.com/p?igshid=abc&si=xyz&fbclid=1&gclid=2')).toBe('https://example.com/p');
  });

  it('prefers a same-site rel=canonical hint', () => {
    expect(canonicalize('https://m.example.com/story?amp=1', 'https://www.example.com/story')).toBe(
      'https://example.com/story',
    );
  });

  it('ignores a cross-site or malformed canonical hint', () => {
    expect(canonicalize('https://blog.example.com/p', 'https://other.com/p')).toBe('https://blog.example.com/p');
    expect(canonicalize('https://example.com/p', 'not a url')).toBe('https://example.com/p');
  });

  it('rejects non-http(s) input with a typed error', () => {
    expect(() => canonicalize('mailto:a@b.com')).toThrow(InvalidUrlError);
    expect(() => canonicalize('file:///etc/hosts')).toThrow(InvalidUrlError);
    expect(() => canonicalize('')).toThrow(InvalidUrlError);
  });

  it('parses without the URL global', () => {
    expect(parseHttpUrl('HTTPS://Example.com/a?b=1#c')).toEqual({
      scheme: 'https',
      host: 'example.com',
      port: '',
      path: '/a',
      query: 'b=1',
    });
  });
});

describe('identify', () => {
  it('gives two share variants of one NYT article the same id (dedupe)', () => {
    const a = identify('https://www.nytimes.com/2026/09/20/tech/story.html');
    const b = identify('https://www.nytimes.com/2026/09/20/tech/story.html?smid=nytcore-ios-share&utm_medium=x');
    expect(a.id).toBe(b.id);
  });

  it('treats http and https as the same article', () => {
    expect(identify('http://example.com/a').id).toBe(identify('https://example.com/a').id);
  });

  it('is deterministic and keeps the doodle in range', () => {
    const first = identify('https://example.com/essay');
    expect(identify('https://example.com/essay')).toEqual(first);
    expect(first.id).toMatch(/^[0-9a-f]{16}$/);
    expect(first.doodle).toBeGreaterThanOrEqual(0);
    expect(first.doodle).toBeLessThan(24);
  });

  it('flags the bundled practice article', () => {
    expect(identify(PRACTICE_URL).isPractice).toBe(true);
    expect(identify('https://www.readr.app/welcome/?utm_source=onboarding').isPractice).toBe(true);
    expect(identify('https://readr.app/other').isPractice).toBe(false);
  });
});

describe('identifyJSON (JSContext entry point)', () => {
  it('extracts a URL from shared text', () => {
    const r = JSON.parse(identifyJSON('Worth a read: https://example.com/p?utm_source=x. Thoughts?'));
    expect(r).toMatchObject({ ok: true, canonicalUrl: 'https://example.com/p' });
  });
  it('never throws', () => {
    expect(JSON.parse(identifyJSON('no link here'))).toEqual({ ok: false, reason: 'no-url' });
  });
});

describe('findUrlInText', () => {
  it('trims trailing punctuation', () => {
    expect(findUrlInText('see (https://example.com/a).')).toBe('https://example.com/a');
  });
});
