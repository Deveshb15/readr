import type { Article } from '../../data/article';
import { groupPaths } from '../../data/sharedContainer';
import { buildReaderHtml, isCurrentTemplate } from './readerHtml';

export type Prepared = { kind: 'page'; uri: string } | { kind: 'linkOnly' };

/**
 * Ensures articles/<id>/reader.html exists for the current template version.
 * Built once from content.html; settings never rewrite it.
 */
export function prepareReader(article: Article): Prepared {
  if (article.status === 'link_only') return { kind: 'linkOnly' };
  const page = groupPaths.articleFile(article.id, 'reader.html');
  const existing = page.exists ? page.textSync().slice(0, 64) : null;
  if (!isCurrentTemplate(existing)) {
    const content = groupPaths.articleFile(article.id, 'content.html');
    if (!content.exists) return { kind: 'linkOnly' };
    page.write(
      buildReaderHtml({
        title: article.title,
        byline: article.byline,
        site: article.site,
        minutes: article.minutes,
        excerpt: article.excerpt,
        lang: null,
        bodyHtml: content.textSync(),
      }),
    );
  }
  return { kind: 'page', uri: page.uri };
}

/** Called when retry replaces content.html so the page is rebuilt on next open. */
export function invalidateReader(id: string): void {
  const page = groupPaths.articleFile(id, 'reader.html');
  if (page.exists) page.delete();
}
