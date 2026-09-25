import type { Article } from './article';
import { naiveMatch, type SearchHit } from './search';

/** Persistence seam. SQLite in the app (db.ts), in-memory in tests. */
export interface ArticleRepo {
  all(): Article[];
  get(id: string): Article | null;
  upsert(article: Article): void;
  remove(id: string): void;
  patch(id: string, fields: Partial<Omit<Article, 'id'>>): void;
  count(): number;
  ingestAttempts(id: string): number;
  recordIngestFailure(id: string): number;
  clearIngestFailure(id: string): void;
  addTombstone(id: string): void;
  tombstones(): string[];
  clearTombstone(id: string): void;
  getSetting(key: string): string | null;
  setSetting(key: string, value: string): void;
  /** Full-text index (title, site, body). Replaces any existing entry for the id. */
  indexText(id: string, title: string, site: string, body: string): void;
  indexedIds(): string[];
  search(query: string, limit?: number): SearchHit[];
}

export function memoryRepo(seed: Article[] = []): ArticleRepo {
  const rows = new Map(seed.map((a) => [a.id, a]));
  const failures = new Map<string, number>();
  const tombs = new Set<string>();
  const settings = new Map<string, string>();
  const index = new Map<string, { title: string; site: string; body: string }>();
  return {
    all: () => [...rows.values()],
    get: (id) => rows.get(id) ?? null,
    upsert: (a) => void rows.set(a.id, a),
    remove: (id) => {
      rows.delete(id);
      index.delete(id);
    },
    patch: (id, fields) => {
      const row = rows.get(id);
      if (row) rows.set(id, { ...row, ...fields });
    },
    count: () => rows.size,
    ingestAttempts: (id) => failures.get(id) ?? 0,
    recordIngestFailure: (id) => {
      const n = (failures.get(id) ?? 0) + 1;
      failures.set(id, n);
      return n;
    },
    clearIngestFailure: (id) => void failures.delete(id),
    addTombstone: (id) => void tombs.add(id),
    tombstones: () => [...tombs],
    clearTombstone: (id) => void tombs.delete(id),
    getSetting: (k) => settings.get(k) ?? null,
    setSetting: (k, v) => void settings.set(k, v),
    indexText: (id, title, site, body) => void index.set(id, { title, site, body }),
    indexedIds: () => [...index.keys()],
    search: (q, limit = 50) =>
      [...index.entries()]
        .filter(([, e]) => naiveMatch(q, [e.title, e.site, e.body]))
        .slice(0, limit)
        .map(([id, e]) => ({ id, title: e.title, snippet: e.body.slice(0, 120) })),
  };
}
