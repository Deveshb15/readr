// URL canonicalisation shared by the app, the share extension (via JavaScriptCore)
// and tests. Must not use Web APIs (URL, URLSearchParams, TextEncoder): a bare
// JSContext doesn't have them.

export class InvalidUrlError extends Error {
  constructor(input: string) {
    super(`Not an http(s) URL: ${input.slice(0, 120)}`);
    this.name = 'InvalidUrlError';
  }
}

const TRACKING_EXACT = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'igshid',
  'si',
  'ref',
  'ref_src',
  'ref_url',
  'smid',
  'smtyp',
  'cmpid',
  'mkt_tok',
  '_hsenc',
  '_hsmi',
  'guccounter',
]);
const TRACKING_PREFIX = ['utm_', 'mc_', 'pk_', 'vero_'];

function isTracking(key: string): boolean {
  const k = key.toLowerCase();
  return TRACKING_EXACT.has(k) || TRACKING_PREFIX.some((p) => k.startsWith(p));
}

const URL_RE = /^(https?):\/\/(?:[^@/?#]*@)?([^/?#:]+)(?::(\d+))?([^?#]*)(\?[^#]*)?(#.*)?$/i;

export type ParsedUrl = { scheme: 'http' | 'https'; host: string; port: string; path: string; query: string };

export function parseHttpUrl(input: string): ParsedUrl {
  const m = URL_RE.exec(input.trim());
  if (!m) throw new InvalidUrlError(input);
  return {
    scheme: m[1].toLowerCase() as 'http' | 'https',
    host: m[2].toLowerCase(),
    port: m[3] ?? '',
    path: m[4] ?? '',
    query: (m[5] ?? '').slice(1),
  };
}

export function siteKey(host: string): string {
  return host.replace(/^www\./, '');
}

/** Same host, or one is a subdomain of the other (m.example.com ~ example.com). */
export function sameSite(a: string, b: string): boolean {
  const x = siteKey(a);
  const y = siteKey(b);
  return x === y || x.endsWith(`.${y}`) || y.endsWith(`.${x}`);
}

function normalizePath(path: string): string {
  if (path === '' || path === '/') return '/';
  const collapsed = path.replace(/\/{2,}/g, '/');
  return collapsed.endsWith('/') ? collapsed.slice(0, -1) : collapsed;
}

function normalizeQuery(query: string): string {
  if (!query) return '';
  const pairs = query
    .split('&')
    .filter((p) => p.length > 0)
    .filter((p) => !isTracking(p.split('=')[0]));
  pairs.sort((a, b) => {
    const [ka, va = ''] = a.split('=');
    const [kb, vb = ''] = b.split('=');
    return ka < kb ? -1 : ka > kb ? 1 : va < vb ? -1 : va > vb ? 1 : 0;
  });
  return pairs.join('&');
}

/**
 * Canonical form: lowercase scheme/host, no `www.`, no default port, no fragment,
 * no tracking params, sorted params, no trailing slash (except root).
 * A `<link rel=canonical>` hint wins when it points at the same site.
 */
export function canonicalize(input: string, canonicalHint?: string | null): string {
  const base = parseHttpUrl(input);
  let chosen = base;
  if (canonicalHint) {
    try {
      const hint = parseHttpUrl(canonicalHint);
      if (sameSite(hint.host, base.host)) chosen = hint;
    } catch {
      // Ignore malformed hints; fall back to the shared URL.
    }
  }
  const defaultPort = chosen.scheme === 'https' ? '443' : '80';
  const port = chosen.port && chosen.port !== defaultPort ? `:${chosen.port}` : '';
  const query = normalizeQuery(chosen.query);
  return `${chosen.scheme}://${siteKey(chosen.host)}${port}${normalizePath(chosen.path)}${query ? `?${query}` : ''}`;
}

/** Scheme-less identity so http/https variants of one article dedupe. */
export function identityKey(canonicalUrl: string): string {
  return canonicalUrl.replace(/^https?:\/\//, '');
}

/** Finds the first http(s) URL inside shared plain text. */
export function findUrlInText(text: string): string | null {
  const m = /https?:\/\/[^\s<>"'”’)\]]+/i.exec(text);
  if (!m) return null;
  return m[0].replace(/[.,;:!?]+$/, '');
}
