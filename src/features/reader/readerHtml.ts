// Builds articles/<id>/reader.html once per template version. Reader settings are
// applied later via CSS variables (window.readr.apply), never by rewriting the file.

export const TEMPLATE_VERSION = 2;
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
    fin: function(){ var f = document.querySelector('.fin'); if (f) f.classList.add('shown'); }
  };
  window.addEventListener('load', function(){ post({ type: 'ready' }); measure(); });
})();
`;

export function buildReaderHtml(doc: ReaderDoc, initialVars: Record<string, string> = {}): string {
  const meta = [doc.site, doc.byline, doc.minutes > 0 ? `${doc.minutes} min` : null]
    .filter(Boolean)
    .map((s) => escapeHtml(String(s)))
    .join(' · ');
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
${meta ? `<p class="byline">${meta}</p>` : ''}
<h1 class="title">${escapeHtml(doc.title)}</h1>
${doc.excerpt ? `<p class="dek">${escapeHtml(doc.excerpt)}</p>` : ''}
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
