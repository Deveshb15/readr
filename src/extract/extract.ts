// Article extraction shared by Safari preprocessing, the extension's off-screen
// web view (URL-only shares) and the app's retry web view. One source, three runtimes.
import { Readability } from '@mozilla/readability';

import { absolutize, isTrackingPixel, localizeImages, normalizeImages, sameImage, type ImageEntry } from './images';

export const MIN_TEXT_CHARS = 250;
export const WORDS_PER_MINUTE = 230;

export type ExtractSuccess = {
  ok: true;
  url: string;
  canonical: string | null;
  title: string;
  byline: string | null;
  siteName: string | null;
  excerpt: string | null;
  lang: string | null;
  html: string;
  images: ImageEntry[];
  leadImage: string | null;
  wordCount: number;
  minutes: number;
};

export type ExtractFailure = {
  ok: false;
  url: string;
  reason: 'not-article' | 'too-short' | 'exception';
  canonical: string | null;
  title: string | null;
};

export type ExtractResult = ExtractSuccess | ExtractFailure;

const DROP_SELECTORS = [
  'script',
  'style',
  'link',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'video',
  'audio',
  'canvas',
  'svg',
  'template',
  'noscript',
].join(',');

const KEEP_ATTRS: Record<string, string[]> = {
  a: ['href', 'title'],
  img: ['src', 'alt', 'width', 'height', 'data-remote'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
  ol: ['start'],
};

function meta(doc: Document, selector: string): string | null {
  return doc.querySelector(selector)?.getAttribute('content')?.trim() || null;
}

function sanitize(root: HTMLElement, base: string): void {
  for (const el of Array.from(root.querySelectorAll(DROP_SELECTORS))) el.remove();
  for (const el of Array.from(root.querySelectorAll('*'))) {
    const keep = KEEP_ATTRS[el.tagName.toLowerCase()] ?? [];
    for (const attr of Array.from(el.attributes)) {
      if (!keep.includes(attr.name)) el.removeAttribute(attr.name);
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      const abs = href ? absolutize(href, base) : null;
      if (abs) el.setAttribute('href', abs);
      else el.removeAttribute('href');
    }
  }
}

/**
 * Mobile Wikipedia (and others) collapse sections with hidden="until-found" so
 * find-in-page can open them. Readability drops hidden nodes, so unhide them in the clone.
 */
function unhideCollapsed(doc: Document): void {
  for (const el of Array.from(doc.querySelectorAll('[hidden="until-found"]'))) el.removeAttribute('hidden');
}

/** Prepends the og:image as a hero figure when the article body doesn't already include it. */
function addHero(container: HTMLElement, hero: string | null, doc: Document): void {
  if (!hero) return;
  const inBody = Array.from(container.querySelectorAll('img')).some((img) => sameImage(img.getAttribute('src') ?? '', hero));
  if (inBody) return;
  const figure = doc.createElement('figure');
  figure.setAttribute('data-hero', '');
  const img = doc.createElement('img');
  img.setAttribute('src', hero);
  img.setAttribute('alt', '');
  if (isTrackingPixel(img)) return;
  figure.appendChild(img);
  container.insertBefore(figure, container.firstChild);
}

function countWords(text: string): number {
  const words = text.trim().split(/\s+/);
  return words[0] === '' ? 0 : words.length;
}

const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * Drops a trailing site name ("Reading - Wikipedia", "Title | The Verge") when the suffix
 * matches the site name or the page's domain. Readability keeps it on short titles.
 */
export function cleanTitle(title: string, siteName: string | null, pageUrl: string): string {
  const m = /^(.{2,}?)\s+[-|–—·:]\s+([^-|–—·:]{2,40})$/u.exec(title.trim());
  if (!m) return title.trim();
  const suffix = squash(m[2]);
  let host = '';
  try {
    host = squash(new URL(pageUrl).hostname.replace(/^www\./, ''));
  } catch {
    // unparseable URL: match on the site name only
  }
  const matches = suffix.length >= 3 && ((siteName && squash(siteName) === suffix) || host.includes(suffix));
  return matches ? m[1].trim() : title.trim();
}

export function extract(doc: Document, pageUrl: string): ExtractResult {
  const base = doc.baseURI && doc.baseURI !== 'about:blank' ? doc.baseURI : pageUrl;
  const canonicalHref = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const canonical = canonicalHref ? absolutize(canonicalHref, base) : null;
  const ogImageRaw = meta(doc, 'meta[property="og:image"]') ?? meta(doc, 'meta[name="twitter:image"]');
  const ogImage = ogImageRaw ? absolutize(ogImageRaw, base) : null;
  const fallbackTitle = meta(doc, 'meta[property="og:title"]') ?? (doc.title || null);

  try {
    // Readability mutates its input; never touch the live page.
    const clone = doc.cloneNode(true) as Document;
    unhideCollapsed(clone);
    normalizeImages(clone, base);
    const article = new Readability(clone, { charThreshold: MIN_TEXT_CHARS, keepClasses: false }).parse();
    if (!article || !article.content) {
      return { ok: false, url: pageUrl, reason: 'not-article', canonical, title: fallbackTitle };
    }
    const text = (article.textContent ?? '').trim();
    if (text.length < MIN_TEXT_CHARS) {
      return { ok: false, url: pageUrl, reason: 'too-short', canonical, title: article.title || fallbackTitle };
    }

    // Inert document: assigning innerHTML here must not load images or run anything.
    const inert = doc.implementation.createHTMLDocument('');
    const container = inert.createElement('div');
    container.innerHTML = article.content;
    sanitize(container, base);
    addHero(container, ogImage, inert);
    const images = localizeImages(container);

    const wordCount = countWords(text);
    const siteName = article.siteName?.trim() || meta(doc, 'meta[property="og:site_name"]');
    return {
      ok: true,
      url: pageUrl,
      canonical,
      title: cleanTitle(article.title || fallbackTitle || '', siteName, pageUrl),
      byline: article.byline?.trim() || meta(doc, 'meta[name="author"]'),
      siteName,
      excerpt: article.excerpt?.trim() || null,
      lang: article.lang || doc.documentElement.getAttribute('lang'),
      html: container.innerHTML,
      images,
      leadImage: images[0]?.src ?? ogImage,
      wordCount,
      minutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    };
  } catch {
    return { ok: false, url: pageUrl, reason: 'exception', canonical, title: fallbackTitle };
  }
}
