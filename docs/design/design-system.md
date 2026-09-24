---
title: Readr design system (v0)
date: 2026-09-24
status: draft
sources: Mobbin — one year (primary UI), Matter / Corner / Cosmos / Orbit (share-sheet UX), Pocket / NYT / Atlantic / Apple News (library), Matter / Fable / Substack (reader settings), Pocket / Atlantic (empty states); every.to (typography)
---

# Readr design system (v0)

**UI language: one year.** Readr borrows one year's grammar: one canvas, one ink, lowercase monospace, hand-drawn doodles, frosted cards.
**Reading language: Every.** Articles are set in an editorial serif with a real italic.

> The app speaks in mono. The writing speaks in serif.

---

## 0. Brand

- **Name:** Readr, with a capital R. Copy is otherwise lowercase; the brand name is the one exception besides bylines.
- **App icon** (`assets/svg/icon-*.svg` → `assets/images/`):
  - one ink book leaning −7° on a hand-drawn ink shelf line, on a light grey gradient (`#F1F1F4` → `#D2D2D8`);
  - an Instrument Serif Italic **R** in paper white on the cover;
  - a paper ribbon bookmark at the top edge, the same cue as the unread ribbon on library covers.
- **Wordmark** (`Wordmark` component): "Readr" in Instrument Serif Italic with the **R** in ink. A hand-drawn shelf underline draws itself in. It's used in the library header and signs the founder letter.

---

## 1. Principles

1. **One ink.** A single ultramarine carries every interactive and celebratory thing. If something is ink, it is either tappable or a moment.
2. **Quiet canvas, loud content.** Chrome is flat grey and lowercase. The article itself is the only place with typographic drama.
3. **Hand-made, not decorated.** Doodles are the illustration system. They get drawn *on screen* as the signature motion.
4. **Numbers are highlighted.** In copy, the number goes in ink and the rest stays faded, e.g. "**03** ready for your flight". This is lifted directly from one year's "trial ends in **07** days".
5. **Always light.** There is no dark mode in v1. Warmth comes from the paper tones, not from theme switching.

---

## 2. Color tokens

Values were sampled from one year's high-resolution screens (the grey canvas and the ink). The reading tones are Readr's own.

| Token | Value | Use |
|---|---|---|
| `canvas` | `#DEDEDE` | App background (one year's exact canvas) |
| `canvas-deep` | `#D2D2D6` | Pressed rows, sunken wells |
| `surface` | `rgba(255,255,255,0.45)` + blur 24 | Frosted cards, pill toggle container, tab bar |
| `surface-solid` | `#FCFCFC` | Keyboard-adjacent sheets, share-extension card |
| `ink` | `#1800CC` | Primary buttons, date chips, doodles, links, numerals, progress |
| `ink-pressed` | `#1200A2` | Pressed ink |
| `ink-wash` | `#D4D0E6` | Tinted fills (one year's compose card), selected-row background |
| `ink-faint` | `rgba(24,0,204,0.35)` | Unselected doodles, dot grid, disabled ink |
| `text` | `#111114` | Primary mono UI text |
| `text-muted` | `#8C8C96` | Secondary copy ("skip", meta) |
| `text-faint` | `#AEAEB4` | Placeholder, tertiary |
| `hairline` | `rgba(0,0,0,0.06)` | Dividers |
| `paper` | `#F6F5F2` | Reader page background (warmer and brighter than canvas, for long reading) |
| `paper-text` | `#1A1A1F` | Reader body |
| `paper-muted` | `#6E6E78` | Captions, byline |
| `danger` | `#C8322B` | Delete swipe only |

Contrast notes:
- Ink on canvas is about 9:1, so ink is safe for text.
- `text-muted` on canvas is about 3.2:1. Use it only for 15pt+ or non-essential copy.
- Reader body on paper is about 16:1.

---

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| UI (everything outside the article) | **Geist Mono** (free; Every uses it too) | Always lowercase in copy. Sentence punctuation kept. |
| Article body | **Newsreader** (Production Type, OFL) | Optical sizes. Stand-in for Every's Signifier. |
| Article display / italic moments | **Instrument Serif Italic** (OFL) | Titles in the save card, "fin.", empty-state lines |
| Hand accents | Hand-drawn SVG, not a font | Sign-offs and underlines, like one year's "Sam & Alec" |

Upgrade path: license Klim's Signifier for app embedding. It swaps a single token.

**UI scale (mono)**

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `mono-xs` | 11 / 14 | 400 | chips, counters ("18/365") |
| `mono-sm` | 13 / 18 | 400 | meta, captions, "skip" |
| `mono-md` | 15 / 22 | 400 | body UI, row titles fallback |
| `mono-lg` | 17 / 24 | 500 | onboarding lines, button labels |

**Reading scale (serif)**

| Token | Size / line | Notes |
|---|---|---|
| `read-title` | 34 / 38, Newsreader Display 500, tracking -0.5 | Article title |
| `read-dek` | 20 / 28, Instrument Serif Italic | Excerpt/standfirst |
| `read-body` | 19 / 30, Newsreader Text 400 | Default. User can adjust ±3 steps |
| `read-h2` | 24 / 30, Newsreader 600 | |
| `read-caption` | 13 / 18, Geist Mono | The app voice leaks into captions on purpose |
| `read-byline` | 12 / 16, Geist Mono, uppercase +0.08em | "EMILY ST. JAMES · VOX · 9 MIN". The one exception to lowercase |

Article rows in the library use `Newsreader 17/22 500` for titles. This gives the list the NYT/Atlantic "saved stories" feel on a mono chrome.

Measure: 62–68 characters. Reader side margins are 24pt, capped to that width on larger phones.

---

## 4. Space, shape, elevation

- **Spacing:** 4-pt grid. Tokens are `4 8 12 16 20 24 32 40 48 64`.
- **Screen insets:** 20pt for lists, 40pt for onboarding and primary buttons (one year's button inset).
- **Radii:**
  - `chip 8`
  - `button 10`
  - `row 16`
  - `card 24`
  - `sheet 32`
  - `pill 999`
  - device mock: `44`
- **Elevation:** frosted cards have no drop shadow. Elevation comes from the blur plus a 1px `rgba(255,255,255,0.6)` inner top highlight. Only the tilted onboarding card and the save card cast a soft shadow (`0 12 32 rgba(20,10,80,0.12)`).
- **Primary button:** full width inside the 40pt inset, 56pt tall, ink fill, white `mono-lg` lowercase label ("save my first article").

---

## 5. Iconography and doodles

- **Doodles** are single-stroke, 1.75pt, ink, round caps. They are drawn on a 32pt grid, with 24pt and 64pt variants. Starter set (about 24): book, paper plane, cloud, cup, lamp, leaf, mushroom, house, snail, moon, window seat, suitcase, glasses, bookmark, envelope, flower ×4, star, kite, chair, headphones.
- **Each saved article gets a doodle stamp.** It is chosen deterministically from the canonical URL hash, so the same article always gets the same stamp. It appears on its row, in the save card, and in the reader header.
- **SF Symbols** only in system chrome that must feel native (share, back chevron, more). Use them at thin weight and tinted `text` or `ink`.

---

## 6. Components

| Component | Borrowed from | Spec |
|---|---|---|
| **InkButton** | one year "send me reminders" | Ink fill, 10 radius, 56pt tall, lowercase mono label. Press: scale 0.97 plus light haptic. |
| **FadedTextButton** | one year "skip" | `mono-sm`, `text-muted`, 44pt hit area |
| **DateChip** | one year "friday, 01.02" / "2026" | Ink fill, white `mono-xs`, 8 radius, 6×10 padding. Used for "today", "offline", "saved 2h ago". |
| **PillToggle** | one year doodle segmented control | Frosted container. The selected segment is ink-filled with a white doodle, the other is `ink-faint`. The selection slides on a spring. |
| **FrostedCard** | one year widget cards | `surface` plus blur, 24 radius, 16 padding, meta row in mono at top ("#42 · wednesday · 02.11"). |
| **TiltedCard** | one year onboarding compose card | Rotated −4°. Settles to −2° on appear with a spring. Onboarding and save-card preview only. |
| **BookCover** | Apple Books / Apple News covers | 2:3 cover: lead image, or a typographic cover (palette by doodle, Instrument Serif title, doodle). Spine gradient, two page sheets peeking right, gloss sheen, ink ribbon while unread. |
| **Shelf** (library default) | Apple Books grid + real bookshelves | Two books per plank, tilted outward ±0.8–2.6° (deterministic per article). Press straightens + lifts. Arrivals drop onto the shelf. Title/meta below the plank. Long-press → actions. |
| **ArticleRow** (list view) | Pocket / NYT | 48pt tilted mini cover · serif title · mono meta. Swipe to delete, long-press actions. |
| **ReaderChrome** | Atoms / Pocket | Floating frosted pill with back and "aa". It hides on scroll-down and returns on scroll-up. A 2pt ink progress hairline sits at the top. |
| **ReaderSettingsSheet** | Fable / Matter / Substack | Three paper tones (paper `#F6F5F2`, white `#FFFFFF`, canvas `#E8E8EA`), font trio (serif / sans / mono), size stepper, width toggle. All light. |
| **SaveCard** (share extension) | one year compose card + TiltedCard | `surface-solid` card with the doodle stamp drawing on, the title in Instrument Serif Italic, mono meta, and a chip that goes from "saving…" to "saved for later". Auto-dismisses. Faded "undo" link. |
| **EmptyState** | Pocket shelf / one year letter | Large doodle drawing itself, then an italic serif line ("nothing saved yet."), a mono helper line, and an InkButton "show me how". |
| **SetupCoach** | one year widget onboarding + Corner / Cosmos / Matter | Phone mock showing an animated iOS share sheet. An instruction line has the key word in ink ("tap **readr** in the share sheet"), followed by an InkButton and a faded "skip". |
| **MiniPlayer** | YouTube / How We Feel | 16:9 frosted frame, 20 radius. Drag and flick to 4 corners. Tap to expand. When in system PiP, a placeholder doodle shows with "playing over your other apps". |
| **Toast** | Finch / Cosmos | Ink pill, white mono, top-center. Springs in and dismisses itself. |

---

## 7. Motion

Everything is spring-based and interruptible, and respects Reduce Motion by falling back to opacity only.

| Moment | Motion | Haptic |
|---|---|---|
| Any press | scale 0.97, spring (stiffness 400, damping 30) | light impact (buttons only) |
| **Doodle draw-on** (signature) | stroke dash offset 1→0 over 600ms ease-out, staggered 40ms per path | — |
| Save card appear | slide up 24pt + fade, then tilt settles −4°→−2° | — |
| Save success | chip morphs "saving…"→"saved", doodle does a small 1.05 pop | success notification |
| Duplicate save | chip shakes ±4pt ×2, shows "already saved" | warning notification |
| New article in library | row expands from 0 height, stamp draws on | — |
| Open article | iOS zoom transition from row to reader | — |
| Reader scroll | chrome hides/shows on direction change. Progress hairline tracks scroll. | — |
| Reach the end | "fin." in Instrument Serif Italic draws an ink underline | soft impact |
| Swipe row | follows the finger with rubber-banding. At the threshold, the icon fills with ink. | rigid impact at threshold |
| PillToggle | selection slides with a spring | selection |
| MiniPlayer flick | momentum projection to the nearest corner | light impact on snap |
| Offline | "offline" DateChip fades in on the library header with copy "no signal. everything here still works." | — |

---

## 8. Voice

- Lowercase, warm, short, and second person.
- Put numbers in ink.
- No exclamation marks except in the celebration after the first save.
- Examples:
  - "saved for later."
  - "**03** ready for your flight."
  - "no signal. everything here still works."
  - "nothing saved yet."
  - "tap **readr** in the share sheet."
- Borrow one year's founder-letter moment once, at the end of onboarding: "hey friend — readr keeps the things you want to read, even at 38,000 ft." Sign it with a hand-drawn signature.

---

## 9. UX patterns pulled from Mobbin

- **Share-sheet setup:**
  - *Matter* triggers the real share sheet inside the app on a sample article, so the first save happens without leaving the app.
  - *Corner / Cosmos* show a mock of the iOS share sheet's app list with Readr toggled on, followed by "you're all set / try again".
  - *Orbit* numbers its steps.
  - Readr combines these in one year's widget-onboarding layout: phone mock, one ink keyword, InkButton, faded skip.
- **Getting-started video:** *Matter* puts a "getting started" video card at the top of the empty queue with a checklist below it. Readr's MiniPlayer tutorial lives there, and system PiP carries it into Safari.
- **Library:** serif title with mono meta, as in *NYT / Atlantic*. Swipe to delete, as in *Atlantic*. Rounded grouped cards, as in *Apple News*.
- **Reader settings:** a bottom sheet like *Fable / Matter*, but kept to four controls.
- **Empty state:** the illustration and one ink call to action come from *Pocket*. The doodle drawing itself comes from one year.
