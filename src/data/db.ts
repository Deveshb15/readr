import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import type { Article } from './article';
import { migrate } from './migrations';
import type { ArticleRepo } from './repo';

// App-private database. Only the app writes it; the extension never opens it
// (no cross-process locks, no 0xdead10cc on suspension).

type Row = {
  id: string;
  url: string;
  canonical_url: string;
  title: string;
  byline: string | null;
  site: string | null;
  excerpt: string | null;
  doodle: number;
  minutes: number;
  word_count: number;
  status: Article['status'];
  source: Article['source'];
  saved_at: number;
  read_at: number | null;
  progress: number;
  scroll_y: number;
  images_total: number;
  images_done: number;
  has_thumb: number;
  retry_attempts: number;
  next_retry_at: number | null;
  updated_at: number;
};

const COLUMNS: Record<keyof Omit<Article, 'id'>, keyof Row> = {
  url: 'url',
  canonicalUrl: 'canonical_url',
  title: 'title',
  byline: 'byline',
  site: 'site',
  excerpt: 'excerpt',
  doodle: 'doodle',
  minutes: 'minutes',
  wordCount: 'word_count',
  status: 'status',
  source: 'source',
  savedAt: 'saved_at',
  readAt: 'read_at',
  progress: 'progress',
  scrollY: 'scroll_y',
  imagesTotal: 'images_total',
  imagesDone: 'images_done',
  hasThumb: 'has_thumb',
  retryAttempts: 'retry_attempts',
  nextRetryAt: 'next_retry_at',
  updatedAt: 'updated_at',
};

function fromRow(r: Row): Article {
  return {
    id: r.id,
    url: r.url,
    canonicalUrl: r.canonical_url,
    title: r.title,
    byline: r.byline,
    site: r.site,
    excerpt: r.excerpt,
    doodle: r.doodle,
    minutes: r.minutes,
    wordCount: r.word_count,
    status: r.status,
    source: r.source,
    savedAt: r.saved_at,
    readAt: r.read_at,
    progress: r.progress,
    scrollY: r.scroll_y,
    imagesTotal: r.images_total,
    imagesDone: r.images_done,
    hasThumb: r.has_thumb === 1,
    retryAttempts: r.retry_attempts,
    nextRetryAt: r.next_retry_at,
    updatedAt: r.updated_at,
  };
}

function toParam(value: unknown): string | number | null {
  if (typeof value === 'boolean') return value ? 1 : 0;
  return (value as string | number | null) ?? null;
}

export function sqliteRepo(db: SQLiteDatabase): ArticleRepo {
  const keys = Object.keys(COLUMNS) as (keyof typeof COLUMNS)[];
  const insertSql = `INSERT OR REPLACE INTO articles (id, ${keys.map((k) => COLUMNS[k]).join(', ')})
                     VALUES (?, ${keys.map(() => '?').join(', ')})`;
  return {
    all: () =>
      db.getAllSync<Row>('SELECT * FROM articles ORDER BY saved_at DESC').map(fromRow),
    get: (id) => {
      const r = db.getFirstSync<Row>('SELECT * FROM articles WHERE id = ?', id);
      return r ? fromRow(r) : null;
    },
    upsert: (a) => {
      db.runSync(insertSql, [a.id, ...keys.map((k) => toParam(a[k]))]);
    },
    remove: (id) => {
      db.runSync('DELETE FROM articles WHERE id = ?', id);
    },
    patch: (id, fields) => {
      const entries = Object.entries(fields) as [keyof typeof COLUMNS, unknown][];
      if (entries.length === 0) return;
      db.runSync(
        `UPDATE articles SET ${entries.map(([k]) => `${COLUMNS[k]} = ?`).join(', ')} WHERE id = ?`,
        [...entries.map(([, v]) => toParam(v)), id],
      );
    },
    count: () => db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM articles')?.n ?? 0,
    ingestAttempts: (id) =>
      db.getFirstSync<{ attempts: number }>('SELECT attempts FROM ingest_failures WHERE id = ?', id)?.attempts ?? 0,
    recordIngestFailure: (id) => {
      db.runSync(
        'INSERT INTO ingest_failures (id, attempts) VALUES (?, 1) ON CONFLICT(id) DO UPDATE SET attempts = attempts + 1',
        id,
      );
      return db.getFirstSync<{ attempts: number }>('SELECT attempts FROM ingest_failures WHERE id = ?', id)?.attempts ?? 1;
    },
    clearIngestFailure: (id) => {
      db.runSync('DELETE FROM ingest_failures WHERE id = ?', id);
    },
    addTombstone: (id) => {
      db.runSync('INSERT OR IGNORE INTO tombstones (id) VALUES (?)', id);
    },
    tombstones: () => db.getAllSync<{ id: string }>('SELECT id FROM tombstones').map((r) => r.id),
    clearTombstone: (id) => {
      db.runSync('DELETE FROM tombstones WHERE id = ?', id);
    },
    getSetting: (key) => db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null,
    setSetting: (key, value) => {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
    },
  };
}

let instance: ArticleRepo | null = null;

/** Opened synchronously so the first library query can gate the splash screen (P3). */
export function repo(): ArticleRepo {
  if (!instance) {
    const db = openDatabaseSync('readr.db');
    db.execSync('PRAGMA journal_mode = WAL');
    migrate(db);
    instance = sqliteRepo(db);
  }
  return instance;
}
