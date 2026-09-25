// Global search over saved articles: title, site and the full text we already downloaded.
// SQLite FTS5 in the app (db.ts); these helpers are pure so they're testable.

export const SNIPPET_OPEN = '\u0002';
export const SNIPPET_CLOSE = '\u0003';

export type SearchHit = {
  id: string;
  /** Title with match markers (SNIPPET_OPEN/CLOSE) around matched terms. */
  title: string;
  /** Body excerpt around the best match, with markers; empty when only the title matched. */
  snippet: string;
};

export type Segment = { text: string; match: boolean };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

/**
 * Article HTML → plain text for the index. Drops scripts/styles/figures and citation marks
 * ("[5]"), breaks lines at blocks, and removes inline tags without adding spaces
 * ("<em>Readr</em>." stays "Readr.").
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|figure|figcaption)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<sup\b[^>]*>\s*(?:<[^>]+>\s*)*\[[^\]]{1,12}\](?:\s*<[^>]+>)*\s*<\/sup>/gi, '')
    .replace(/<\/?(p|h\d|li|ul|ol|blockquote|div|section|article|header|footer|table|tr|pre|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/?(td|th|dd|dt)\b[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** User input → safe FTS5 query: every word must appear, last word matches as a prefix. */
export function toFtsQuery(input: string): string | null {
  const words = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 8);
  if (words.length === 0) return null;
  return words.map((w, i) => (i === words.length - 1 ? `"${w}"*` : `"${w}"`)).join(' ');
}

/** Terms to highlight in the reader after opening a search result. */
export function queryTerms(input: string): string[] {
  return input
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2)
    .slice(0, 8);
}

export function parseSnippet(s: string): Segment[] {
  const out: Segment[] = [];
  let match = false;
  let buf = '';
  for (const ch of s) {
    if (ch === SNIPPET_OPEN || ch === SNIPPET_CLOSE) {
      if (buf) out.push({ text: buf, match });
      buf = '';
      match = ch === SNIPPET_OPEN;
    } else {
      buf += ch;
    }
  }
  if (buf) out.push({ text: buf, match });
  return out;
}

/** Reference implementation for tests (memory repo): case-insensitive AND of words, prefix on last. */
export function naiveMatch(query: string, fields: string[]): boolean {
  const words = input(query);
  const hay = fields.join(' ').toLowerCase();
  return words.length > 0 && words.every((w) => hay.includes(w));
}

function input(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
