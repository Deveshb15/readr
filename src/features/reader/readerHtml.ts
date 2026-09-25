// Builds articles/<id>/reader.html once per template version. Reader settings are
// applied later via CSS variables (window.readr.apply), never by rewriting the file.

import { htmlToText } from '../../data/search';

export const TEMPLATE_VERSION = 5;
export const TEMPLATE_MARKER = `<!-- readr-template:${TEMPLATE_VERSION} -->`;

/** Relative from articles/<id>/reader.html to the seeded reader-assets folder. */
export const ASSETS_REL = '../../reader-assets/';

export type ReaderDoc = {
  title: string;
  byline: string | null;
  site: string | null;
  minutes: number;
  excerpt: string | null;
  lang: string | null;
  bodyHtml: string;
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isCurrentTemplate(html: string | null): boolean {
  return !!html && html.startsWith(TEMPLATE_MARKER);
}

// Runs inside the page: scroll bridge (rAF, ≥0.5% change), missing-image placeholders,
// link interception, "fin." reveal, and live settings.
const BRIDGE = `
(function(){
  var post = function(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var last = -1, ticking = false;
  function measure(){
    ticking = false;
    var y = window.scrollY, h = document.documentElement.scrollHeight, vh = window.innerHeight;
    var p = h <= vh ? 1 : Math.min(1, Math.max(0, y / (h - vh)));
    if (Math.abs(p - last) >= 0.005 || p === 1 || p === 0) { last = p; post({ type: 'scroll', y: y, h: h, vh: vh, p: p }); }
  }
  window.addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(measure); } }, { passive: true });
  function placeholder(img){
    var w = +img.getAttribute('width'), h = +img.getAttribute('height');
    var box = document.createElement('div');
    box.className = 'missing-img';
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', img.getAttribute('alt') || 'image not saved');
    box.style.cssText = 'width:100%;border-radius:10px;background:var(--wash);aspect-ratio:' + (w && h ? w + '/' + h : '3/2');
    img.replaceWith(box);
  }
  Array.prototype.forEach.call(document.querySelectorAll('article img'), function(img){
    if (img.complete && img.naturalWidth === 0) placeholder(img);
    else img.addEventListener('error', function(){ placeholder(img); }, { once: true });
  });
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && /^https?:/.test(a.href)) { e.preventDefault(); post({ type: 'link', href: a.href }); }
  });
  window.readr = {
    apply: function(vars){ for (var k in vars) document.documentElement.style.setProperty(k, vars[k]); measure(); },
    scrollTo: function(y){ window.scrollTo(0, y); measure(); },
    fin: function(){ var f = document.querySelector('.fin'); if (f) f.classList.add('shown'); },
    // Search → reader: wrap matches in <mark class="hit"> and bring the first into view.
    highlight: function(terms){
      if (!terms || !terms.length) return 0;
      // Terms come from queryTerms(): letters and digits only, so no regex escaping is needed.
      var esc = terms;
      var re = new RegExp('(' + esc.join('|') + ')', 'gi');
      var root = document.querySelector('main');
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walker.nextNode())) { if (re.test(n.nodeValue)) nodes.push(n); re.lastIndex = 0; }
      var first = null, count = 0;
      nodes.forEach(function(node){
        var frag = document.createDocumentFragment(), text = node.nodeValue, last = 0, m;
        re.lastIndex = 0;
        while ((m = re.exec(text))) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mark = document.createElement('mark'); mark.className = 'hit'; mark.textContent = m[0];
          frag.appendChild(mark); if (!first) first = mark; count++; last = m.index + m[0].length;
        }
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
      if (first) {
        first.classList.add('first');
        var y = first.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
        window.scrollTo(0, Math.max(0, y)); measure();
      }
      return count;
    }
  };
  window.addEventListener('load', function(){ post({ type: 'ready' }); measure(); });
})();
`;

const CITATION = /\s*\[[^\]]{1,12}\]/g;
const normalize = (s: string) =>
  s.toLowerCase().replace(CITATION, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * The description line under the title, or null when it would just repeat the opening
 * paragraph (many sites use their first paragraph as the description).
 */
export function dekFor(excerpt: string | null, bodyHtml: string): string | null {
  if (!excerpt) return null;
  const dek = excerpt.replace(CITATION, '').trim();
  const probe = normalize(dek).slice(0, 80);
  if (!probe) return null;
  return normalize(htmlToText(bodyHtml.slice(0, 6000))).includes(probe) ? null : dek;
}

/** "by Ada Lin", unless the byline just repeats the site or is too long to read at a glance. */
export function bylineFor(byline: string | null, site: string | null): string | null {
  const b = byline?.trim();
  if (!b || b.length > 60 || (site && normalize(b) === normalize(site))) return null;
  return /^by\s/i.test(b) ? b : `by ${b}`;
}

export function buildReaderHtml(doc: ReaderDoc, initialVars: Record<string, string> = {}): string {
  const kicker = [doc.site, doc.minutes > 0 ? `${doc.minutes} min read` : null]
    .filter(Boolean)
    .map((s) => escapeHtml(String(s)))
    .join(' · ');
  const dek = dekFor(doc.excerpt, doc.bodyHtml);
  const byline = bylineFor(doc.byline, doc.site);
  const vars = Object.entries(initialVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `${TEMPLATE_MARKER}
<!doctype html>
<html lang="${escapeHtml(doc.lang ?? 'en')}" style="${escapeHtml(vars)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file: data:; style-src 'self' file: 'unsafe-inline'; font-src 'self' file:; script-src 'unsafe-inline'">
<link rel="stylesheet" href="${ASSETS_REL}reader.css">
<title>${escapeHtml(doc.title)}</title>
</head>
<body>
<main>
<header class="article-head">
${kicker ? `<p class="kicker">${kicker}</p>` : ''}
<h1 class="title">${escapeHtml(doc.title)}</h1>
${dek ? `<p class="dek">${escapeHtml(dek)}</p>` : ''}
${byline ? `<p class="byline">${escapeHtml(byline)}</p>` : ''}
<hr class="head-rule">
</header>
<article>
${doc.bodyHtml}
</article>
<p class="fin" aria-hidden="true"><span>fin.</span></p>
</main>
<script>${BRIDGE}</script>
</body>
</html>`;
}
