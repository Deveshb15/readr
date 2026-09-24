// Reader stylesheet, seeded into App Group reader-assets/reader.css.
// Typography follows docs/design/design-system.md (reading scale). Settings apply
// live through CSS variables on :root — no page rewrite.

export const readerCss = `
@font-face { font-family: "Newsreader"; src: url("fonts/Newsreader-Variable.ttf") format("truetype"); font-weight: 200 800; font-style: normal; }
@font-face { font-family: "Newsreader"; src: url("fonts/Newsreader-Italic-Variable.ttf") format("truetype"); font-weight: 200 800; font-style: italic; }
@font-face { font-family: "Instrument Serif"; src: url("fonts/InstrumentSerif-Italic.ttf") format("truetype"); font-style: italic; }
@font-face { font-family: "Geist Mono"; src: url("fonts/GeistMono-Variable.ttf") format("truetype"); font-weight: 100 900; }

:root {
  --paper: #F6F5F2;
  --ink-text: #1A1A1F;
  --muted: #6E6E78;
  --ink: #1800CC;
  --wash: #D4D0E6;
  --body-font: "Newsreader", "New York", Georgia, serif;
  --body-size: 19px;
  --body-leading: 1.58;
  --measure: 34em;
  --chrome-top: 96px;
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  margin: 0;
  padding: var(--chrome-top) 24px 160px;
  background: var(--paper);
  color: var(--ink-text);
  font-family: var(--body-font);
  font-size: var(--body-size);
  line-height: var(--body-leading);
  font-optical-sizing: auto;
  font-kerning: normal;
  font-variant-ligatures: common-ligatures;
  hyphens: auto;
  -webkit-hyphens: auto;
  overflow-wrap: break-word;
  -webkit-tap-highlight-color: transparent;
}
main { max-width: var(--measure); margin: 0 auto; }

header.article-head { margin-bottom: 36px; }
.byline {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 12px; line-height: 16px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--muted); margin: 0 0 14px;
}
h1.title {
  font-family: "Newsreader", serif; font-weight: 500; font-variation-settings: "opsz" 72;
  font-size: 34px; line-height: 38px; letter-spacing: -0.5px; margin: 0 0 14px; text-wrap: balance;
}
.dek { font-family: "Instrument Serif", "Newsreader", serif; font-style: italic; font-size: 21px; line-height: 28px; color: var(--muted); margin: 0; }

article p { margin: 0 0 1.05em; }
article > p:first-of-type::first-letter {
  float: left; font-size: 3.4em; line-height: 0.82; padding: 0.06em 0.08em 0 0; font-weight: 500; color: var(--ink);
}
article h2, article h3 { font-weight: 600; line-height: 1.25; margin: 1.8em 0 0.6em; text-wrap: balance; }
article h2 { font-size: 1.26em; }
article h3 { font-size: 1.08em; }
article a { color: var(--ink); text-decoration-thickness: 1px; text-underline-offset: 3px; }
article em, article i { font-style: italic; }
article blockquote {
  margin: 1.6em 0; padding: 0 0 0 18px; border-left: 2px solid var(--ink);
  font-style: italic; color: var(--ink-text);
}
article figure { margin: 1.8em 0; }
article img { display: block; max-width: 100%; height: auto; border-radius: 10px; background: var(--wash); }
article img.missing { width: 100%; aspect-ratio: var(--ratio, 3 / 2); }
article figcaption, article .caption {
  font-family: "Geist Mono", ui-monospace, monospace; font-size: 13px; line-height: 18px; color: var(--muted); margin-top: 8px;
}
article pre, article code { font-family: "Geist Mono", ui-monospace, monospace; font-size: 0.8em; }
article pre { background: rgba(0,0,0,0.04); padding: 14px; border-radius: 10px; overflow-x: auto; }
article table { width: 100%; border-collapse: collapse; font-size: 0.85em; display: block; overflow-x: auto; }
article td, article th { border-bottom: 1px solid rgba(0,0,0,0.08); padding: 6px 8px; text-align: left; }
article hr { border: 0; text-align: center; margin: 2em 0; }
article hr::after { content: "· · ·"; color: var(--muted); letter-spacing: 0.4em; }
article ul, article ol { padding-left: 1.2em; }
article li { margin-bottom: 0.4em; }

.fin {
  text-align: center; margin: 72px 0 0; font-family: "Instrument Serif", serif; font-style: italic; font-size: 30px; color: var(--ink-text);
  opacity: 0; transform: translateY(8px); transition: opacity 420ms ease-out, transform 420ms ease-out;
}
.fin span { background-image: linear-gradient(var(--ink), var(--ink)); background-repeat: no-repeat; background-position: 0 100%; background-size: 0% 2px; transition: background-size 600ms ease-out 200ms; padding-bottom: 2px; }
.fin.shown { opacity: 1; transform: none; }
.fin.shown span { background-size: 100% 2px; }
@media (prefers-reduced-motion: reduce) { .fin, .fin span { transition: none; } }

::selection { background: var(--wash); }
`.trim();
