# Performance budgets (plan U11)

Measure on an iPhone 13-class device, using a Release build where noted. Fill in the "measured" column. Record any deviation with a follow-up.

| Budget | Target | How to measure | Measured |
|---|---|---|---|
| Extension first frame (P1) | ≤300 ms | Instruments → Points of Interest: share tap → `card-visible` event (`com.devesh.readr.share`) | |
| Card dismissible (R6) | ≤2.0 s | `save` interval from `card-visible` to the end of `save` | |
| Extension peak memory (P2) | <60 MB | Xcode Debug Navigator → Memory, sharing a 5,000-word, 20-image article | |
| Cold start → interactive library (P3) | ≤800 ms | Dev log `[perf] library-first-commit` (JS start). Instruments App Launch for the native part (Release). | |
| Library scroll, 500 rows (P4) | 60/120 fps | Seed 500 articles. Perf Monitor while flinging. | |
| Open article → text visible (P5) | ≤250 ms | Dev log `[perf] open-article → text visible` | |

## Levers already in place

- **Extension:**
  - SwiftUI only, no React Native.
  - The JSContext and web view are created lazily. The web view is torn down right after extraction.
  - Images are streamed to disk. Thumbnails use ImageIO downsampling.
- **Startup:**
  - Fonts are embedded at build time.
  - The database opens synchronously and the first library read happens before the first render.
  - Seeding and retries run after first paint.
  - `ExtractorHost` mounts only while it has a job. The tutorial player mounts only when the tutorial is open.
- **List:**
  - FlashList v2.
  - Rows are memoised on `id` + `updatedAt` + `readAt`.
  - 168 px JPEG thumbnails.
  - Doodles are static, except that newly arrived rows draw themselves.
- **Reader:**
  - `reader.html` is built once per template version.
  - Settings apply through CSS variables.
  - A native title placeholder shows while the web view warms up, behind the zoom transition.
  - The scroll bridge posts on `requestAnimationFrame`, and only when progress changes by at least 0.5%.

## Accessibility and motion checks

- Turn on Reduce Motion. Check that:
  - doodles appear already drawn;
  - there is no card tilt, slide or shake;
  - the mini player fades instead of zooming;
  - toasts fade.
  Haptics are unchanged.
- VoiceOver:
  - Library rows read "title. site · minutes · saved… . unread".
  - Doodles are decorative, so VoiceOver skips them.
  - The mini player announces "tap to expand, drag to move".
- Dynamic Type:
  - Reader size is controlled by the reader settings sheet, not Dynamic Type.
  - Mono UI text should still lay out at accessibility sizes. This needs a device check.
