// Image normalisation before Readability runs: lazy-load attributes, srcset,
// <noscript> fallbacks, <picture>. Runs in a DOM (Safari page, WKWebView, jsdom).

const LAZY_ATTRS = ['data-src', 'data-lazy-src', 'data-original', 'data-url', 'data-hi-res-src'];
const LAZY_SRCSET_ATTRS = ['data-srcset', 'data-lazy-srcset'];
export const MAX_IMAGE_WIDTH = 1400;

export function absolutize(url: string, base: string): string | null {
  try {
    const u = new URL(url.trim(), base);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Picks the widest `w` candidate ≤ maxWidth (or the smallest above it), or the highest `x` density. */
export function pickFromSrcset(srcset: string, base: string, maxWidth = MAX_IMAGE_WIDTH): string | null {
  const candidates = srcset
    .split(/,\s+(?=\S)/)
    .map((part) => {
      const [url, descriptor = '1x'] = part.trim().split(/\s+/);
      const w = /^(\d+)w$/.exec(descriptor);
      const x = /^([\d.]+)x$/.exec(descriptor);
      return { url, w: w ? +w[1] : null, x: x ? +x[1] : null };
    })
    .filter((c) => c.url && !c.url.startsWith('data:'));
  if (candidates.length === 0) return null;
  const widths = candidates.filter((c) => c.w !== null) as { url: string; w: number }[];
  let chosen: string;
  if (widths.length > 0) {
    const within = widths.filter((c) => c.w <= maxWidth).sort((a, b) => b.w - a.w);
    chosen = within.length > 0 ? within[0].url : widths.sort((a, b) => a.w - b.w)[0].url;
  } else {
    chosen = candidates.sort((a, b) => (b.x ?? 1) - (a.x ?? 1))[0].url;
  }
  return absolutize(chosen, base);
}

function isPlaceholder(src: string | null): boolean {
  return !src || src.startsWith('data:') || /blank|spacer|pixel|placeholder|lazy/i.test(src);
}

export function normalizeImages(doc: Document, base: string): void {
  // <noscript><img></noscript> fallbacks replace a placeholder sibling.
  for (const ns of Array.from(doc.querySelectorAll('noscript'))) {
    // With scripting on (Safari, web views) noscript content is raw text; with it
    // off (jsdom, JS-disabled web views) it is parsed into elements.
    let img = ns.querySelector('img');
    if (!img) {
      const html = ns.textContent ?? '';
      if (!/<img/i.test(html)) continue;
      const tpl = doc.createElement('template');
      tpl.innerHTML = html;
      img = tpl.content.querySelector('img');
    }
    if (!img) continue;
    const prev = ns.previousElementSibling;
    if (prev?.tagName === 'IMG' && isPlaceholder(prev.getAttribute('src'))) prev.remove();
    ns.replaceWith(img);
  }

  for (const img of Array.from(doc.querySelectorAll('img'))) {
    let src: string | null = null;
    const srcset =
      LAZY_SRCSET_ATTRS.map((a) => img.getAttribute(a)).find(Boolean) ??
      img.getAttribute('srcset') ??
      img.closest('picture')?.querySelector('source[srcset]')?.getAttribute('srcset') ??
      null;
    if (srcset) src = pickFromSrcset(srcset, base);
    if (!src) {
      const lazy = LAZY_ATTRS.map((a) => img.getAttribute(a)).find((v) => v && !v.startsWith('data:'));
      const raw = lazy ?? img.getAttribute('src');
      src = raw && !isPlaceholder(raw) ? absolutize(raw, base) : null;
    }
    if (src) {
      img.setAttribute('src', src);
    } else {
      img.remove();
      continue;
    }
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.removeAttribute('loading');
    for (const a of [...LAZY_ATTRS, ...LAZY_SRCSET_ATTRS]) img.removeAttribute(a);
  }
  for (const source of Array.from(doc.querySelectorAll('picture source'))) source.remove();
}

export type ImageEntry = {
  index: number;
  src: string;
  file: string;
  width: number | null;
  height: number | null;
};

export function extensionFor(url: string): string {
  const m = /\.(jpe?g|png|gif|webp|avif)(?:$|[?#])/i.exec(url);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

/** Rewrites <img src> to local `images/<n>.<ext>` and returns the download manifest. */
export function localizeImages(root: ParentNode): ImageEntry[] {
  const byUrl = new Map<string, ImageEntry>();
  const out: ImageEntry[] = [];
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const src = img.getAttribute('src');
    if (!src || !/^https?:/i.test(src)) {
      img.remove();
      continue;
    }
    let entry = byUrl.get(src);
    if (!entry) {
      const index = out.length;
      const num = (v: string | null) => (v && /^\d+$/.test(v) ? +v : null);
      entry = {
        index,
        src,
        file: `images/${index}.${extensionFor(src)}`,
        width: num(img.getAttribute('width')),
        height: num(img.getAttribute('height')),
      };
      byUrl.set(src, entry);
      out.push(entry);
    }
    img.setAttribute('src', entry.file);
    img.setAttribute('data-remote', src);
  }
  return out;
}
