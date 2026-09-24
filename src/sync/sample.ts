import { identify, PRACTICE_URL } from '../core';
import { META_SCHEMA, type ArticleMeta } from '../data/articleMeta';

// The practice article. The extension recognises PRACTICE_URL and copies this
// (seeded into samples/welcome/) instead of fetching, so the first save works offline.

const identity = identify(PRACTICE_URL);

export const sampleHtml = `
<p>You just saved this without leaving the app. That’s the whole trick: anywhere you can tap <em>share</em>, you can tap <strong>Readr</strong>, and the words come with you.</p>
<p>Everything you save is kept on this phone — the text, the pictures, even the italics. On a plane, in a tunnel, at the cabin with one bar of signal, it opens like it did at your desk.</p>
<h2>A few small things</h2>
<p>Scroll to the end of an article and it’s marked read. Its dot on your shelf turns into its own little doodle. That’s it. No streaks, no goals.</p>
<p>If a page can’t be saved properly — a post, a video, an app pretending to be a website — Readr keeps the link and tells you it needs internet. When you’re back online, it quietly tries again.</p>
<blockquote>Before you board, glance at the top of your library. If it says <em>all set for your flight</em>, you are.</blockquote>
<p>Happy reading.</p>
`.trim();

export function sampleMeta(savedAt = new Date()): ArticleMeta {
  return {
    schema: META_SCHEMA,
    id: identity.id,
    url: PRACTICE_URL,
    canonicalUrl: identity.canonicalUrl,
    title: 'welcome to Readr',
    byline: 'the Readr team',
    site: 'Readr',
    excerpt: 'Everything you save is kept on this phone.',
    lang: 'en',
    doodle: identity.doodle,
    minutes: 1,
    wordCount: 160,
    status: 'ready',
    source: 'practice',
    savedAt: savedAt.toISOString(),
    leadImage: null,
    hasThumb: false,
    images: [],
  };
}
