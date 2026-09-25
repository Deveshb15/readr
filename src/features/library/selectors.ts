import { siteLabel, type Article } from '../../data/article';

export type LibraryGroups = { unread: Article[]; read: Article[] };

/** Unread newest-first; read in its own group, most recently finished first. */
export function groupLibrary(articles: Article[]): LibraryGroups {
  const unread: Article[] = [];
  const read: Article[] = [];
  for (const a of articles) (a.readAt ? read : unread).push(a);
  unread.sort((a, b) => b.savedAt - a.savedAt);
  read.sort((a, b) => (b.readAt ?? 0) - (a.readAt ?? 0));
  return { unread, read };
}

export type ShelfDot = { id: string; doodle: number; read: boolean };

/** One dot per article saved this calendar month, oldest first (the row fills left to right). */
export function shelfDots(articles: Article[], now: Date): ShelfDot[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  return articles
    .filter((a) => {
      const d = new Date(a.savedAt);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .sort((a, b) => a.savedAt - b.savedAt)
    .map((a) => ({ id: a.id, doodle: a.doodle, read: a.readAt !== null }));
}

export function monthLabel(now: Date): string {
  return now.toLocaleString('en-US', { month: 'long' }).toLowerCase();
}

export type FlightStatus = { kind: 'none' } | { kind: 'notReady'; count: number } | { kind: 'allSet' };

/** Pre-flight check: partial + link-only items are not fully offline, read or not. */
export function flightStatus(articles: Article[]): FlightStatus {
  if (articles.length === 0) return { kind: 'none' };
  const count = articles.filter((a) => a.status !== 'ready').length;
  return count > 0 ? { kind: 'notReady', count } : { kind: 'allSet' };
}

export function flightCopy(status: FlightStatus): string | null {
  switch (status.kind) {
    case 'none':
      return null;
    case 'notReady':
      return `${status.count} not ready offline`;
    case 'allSet':
      return 'all set for your flight';
  }
}

export function relativeSaved(savedAt: number, now: number): string {
  const s = Math.max(0, Math.round((now - savedAt) / 1000));
  if (s < 60) return 'saved just now';
  const m = Math.round(s / 60);
  if (m < 60) return `saved ${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `saved ${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `saved ${d}d ago`;
  return `saved ${new Date(savedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '.')}`;
}

export function rowMeta(a: Article, now: number): string {
  const parts = [siteLabel(a)];
  if (a.status !== 'link_only') parts.push(`${a.minutes} min`);
  parts.push(relativeSaved(a.savedAt, now));
  return parts.filter(Boolean).join(' · ');
}

/** The article to resume: the last one opened, if it's partway through and unread. */
export function continueReading(articles: Article[], lastOpenedId: string | null): Article | null {
  if (!lastOpenedId) return null;
  const a = articles.find((x) => x.id === lastOpenedId);
  if (!a || a.readAt !== null || a.status === 'link_only') return null;
  return a.progress > 0.01 && a.progress < 0.97 ? a : null;
}
