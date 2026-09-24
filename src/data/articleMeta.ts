// The on-disk contract between the share extension (writer) and the app (reader).
// Mirrors ArticleMeta in targets/share/ArticleWriter.swift. Bump SCHEMA on breaking changes
// and teach ingest to migrate.

export const META_SCHEMA = 1;

export type ArticleStatus = 'ready' | 'partial' | 'link_only';
export type ArticleSource = 'safari' | 'share' | 'practice';

export type MetaImage = {
  index: number;
  src: string;
  file: string;
  width: number | null;
  height: number | null;
  done: boolean;
};

export type ArticleMeta = {
  schema: number;
  id: string;
  url: string;
  canonicalUrl: string;
  title: string;
  byline: string | null;
  site: string | null;
  excerpt: string | null;
  lang: string | null;
  doodle: number;
  minutes: number;
  wordCount: number;
  status: ArticleStatus;
  source: ArticleSource;
  savedAt: string;
  leadImage: string | null;
  hasThumb: boolean;
  images: MetaImage[];
};

export function isArticleMeta(value: unknown): value is ArticleMeta {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.schema === 'number' &&
    typeof m.id === 'string' &&
    /^[0-9a-f]{16}$/.test(m.id) &&
    typeof m.url === 'string' &&
    typeof m.canonicalUrl === 'string' &&
    typeof m.title === 'string' &&
    typeof m.doodle === 'number' &&
    (m.status === 'ready' || m.status === 'partial' || m.status === 'link_only') &&
    (m.source === 'safari' || m.source === 'share' || m.source === 'practice') &&
    typeof m.savedAt === 'string' &&
    Array.isArray(m.images)
  );
}

export function statusFor(meta: Pick<ArticleMeta, 'status' | 'images'>): ArticleStatus {
  if (meta.status === 'link_only') return 'link_only';
  return meta.images.every((i) => i.done) ? 'ready' : 'partial';
}
