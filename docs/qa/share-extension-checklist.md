# Share extension — device QA checklist (plan U4)

Run on a physical iPhone with a dev build (`npm run prebuild` then `npx expo run:ios --device`).
The extension has no automated tests. Its shared logic is covered by Jest (`src/core`, `src/extract`).

| # | Scenario | Steps | Expected | Covers |
|---|---|---|---|---|
| 1 | Safari article | Safari → any long-form article → Share → readr | Card within ~300 ms. Doodle draws itself. "saved for later" with a success haptic. Back in Safari in ≤2 s. | F1, P1 |
| 2 | Offline afterwards | After #1, never open readr. Airplane mode, then open readr. | Article is listed and opens with text and images. | AE5 |
| 3 | Unlocked paywall | Log in to a paywalled site in Safari. Share a full article. | Full body saved, not the teaser. | AE3 |
| 4 | Duplicate | Share #1 again, this time with `?utm_source=x` added. | "already saved" chip shakes with a warning haptic. No second folder. | AE1 |
| 5 | Non-article | X app → a post → Share → readr | "saved link" chip, meta "needs internet". `meta.json` has `status: link_only`. | F2, AE2 |
| 6 | Offline URL share | Chrome with the device offline → Share → readr | Link-only. Card closes by ~6 s at worst (4 s fetch timeout plus linger). | F2 |
| 7 | Image-heavy on slow network | Network Link Conditioner "3G". Share an article with 30+ images. | Card dismissible at ~2 s. `status: partial`, some images `done: false`. | R6, P1 |
| 8 | Undo | Tap "undo" while the card shows "saved for later". | No `articles/<id>` and no `inbox/<id>` left behind. | R6 |
| 9 | Text with a URL | Notes → select "read this https://example.com/post today" → Share → readr | That URL is saved. | R1 |
| 10 | Practice URL | In the app, onboarding "save my first article" → readr in the share sheet | Works in airplane mode. `source: practice`. | R14 |
| 11 | Memory | Xcode → Debug Navigator → Memory while sharing a 5,000-word, 20-image article | Peak under 60 MB. | P2 |
| 12 | Reduce Motion | Settings → Accessibility → Reduce Motion on. Repeat #1. | No tilt, slide or shake. Doodle appears drawn. Haptics unchanged. | R18 |
