import { buildReaderHtml, escapeHtml, isCurrentTemplate, TEMPLATE_MARKER } from '../readerHtml';
import { cssVars, DEFAULT_SETTINGS, parseSettings } from '../settingsStore';

const doc = {
  title: 'A <script>alert(1)</script> title',
  byline: 'Ada "Lin"',
  site: 'Field Notes',
  minutes: 7,
  excerpt: 'An excerpt & more',
  lang: 'en',
  bodyHtml: '<p>Body</p><img src="images/0.jpg">',
};

describe('buildReaderHtml', () => {
  const html = buildReaderHtml(doc);

  it('escapes title, byline and excerpt', () => {
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('A &lt;script&gt;alert(1)&lt;/script&gt; title');
    expect(html).toContain('Ada &quot;Lin&quot;');
    expect(html).toContain('An excerpt &amp; more');
  });

  it('references reader-assets relative to articles/<id>/', () => {
    expect(html).toContain('href="../../reader-assets/reader.css"');
  });

  it('keeps the local image paths from extraction', () => {
    expect(html).toContain('<img src="images/0.jpg">');
  });

  it('starts with the template marker so stale pages get rebuilt', () => {
    expect(html.startsWith(TEMPLATE_MARKER)).toBe(true);
    expect(isCurrentTemplate(html)).toBe(true);
    expect(isCurrentTemplate('<!-- readr-template:0 -->')).toBe(false);
    expect(isCurrentTemplate(null)).toBe(false);
  });

  it('blocks network loads via CSP (offline-only page)', () => {
    expect(html).toContain("default-src 'none'");
    expect(html).not.toMatch(/img-src[^;]*https/);
  });

  it('omits minutes for link-only style docs', () => {
    expect(buildReaderHtml({ ...doc, minutes: 0 })).not.toContain('0 min');
  });
});

describe('escapeHtml', () => {
  it('escapes quotes and ampersands', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

describe('reader settings', () => {
  it('switching mono → serif changes only CSS variables', () => {
    const mono = cssVars({ ...DEFAULT_SETTINGS, font: 'mono' });
    const serif = cssVars({ ...DEFAULT_SETTINGS, font: 'serif' });
    const changed = Object.keys(serif).filter((k) => serif[k] !== mono[k]);
    expect(changed.sort()).toEqual(['--body-font', '--body-leading']);
  });

  it('parses stored settings defensively', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{bad json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(JSON.stringify({ tone: 'neon', size: 99, font: 'mono' }))).toEqual({
      ...DEFAULT_SETTINGS,
      font: 'mono',
      size: 6,
    });
  });
});
