// Schema migrations, kept free of native imports so they're testable in Jest.

const MIGRATIONS: string[] = [
  `CREATE TABLE articles (
     id TEXT PRIMARY KEY NOT NULL,
     url TEXT NOT NULL,
     canonical_url TEXT NOT NULL,
     title TEXT NOT NULL,
     byline TEXT,
     site TEXT,
     excerpt TEXT,
     doodle INTEGER NOT NULL,
     minutes INTEGER NOT NULL,
     word_count INTEGER NOT NULL,
     status TEXT NOT NULL,
     source TEXT NOT NULL,
     saved_at INTEGER NOT NULL,
     read_at INTEGER,
     progress REAL NOT NULL DEFAULT 0,
     scroll_y REAL NOT NULL DEFAULT 0,
     images_total INTEGER NOT NULL DEFAULT 0,
     images_done INTEGER NOT NULL DEFAULT 0,
     has_thumb INTEGER NOT NULL DEFAULT 0,
     retry_attempts INTEGER NOT NULL DEFAULT 0,
     next_retry_at INTEGER,
     updated_at INTEGER NOT NULL
   );
   CREATE INDEX articles_library ON articles (read_at, saved_at DESC);
   CREATE INDEX articles_status ON articles (status);
   CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
   CREATE TABLE ingest_failures (id TEXT PRIMARY KEY NOT NULL, attempts INTEGER NOT NULL);
   CREATE TABLE tombstones (id TEXT PRIMARY KEY NOT NULL);`,
  // v2: offline control + full-text search over saved articles.
  `ALTER TABLE articles ADD COLUMN keep_offline INTEGER NOT NULL DEFAULT 1;
   ALTER TABLE articles ADD COLUMN size_bytes INTEGER NOT NULL DEFAULT 0;
   CREATE VIRTUAL TABLE article_fts USING fts5(
     id UNINDEXED, title, site, body,
     tokenize = 'porter unicode61 remove_diacritics 2'
   );`,
];

type Migratable = {
  execSync(sql: string): void;
  getFirstSync<T>(sql: string): T | null;
  withTransactionSync(task: () => void): void;
};

export function migrate(db: Migratable): void {
  const current = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[v]);
      db.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
