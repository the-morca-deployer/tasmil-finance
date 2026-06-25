# Landing Page Visual Baseline — MANIFEST

Captured: 2026-06-25T09:03:19.508Z
Base URL: http://localhost:3000
Branch: feat/landing-tailwind-shadcn-migration

## Capture Method (later "after" shots MUST match this exactly)

Reproduce with the committed script:

```bash
# dev server must be serving the landing routes first (pnpm dev on :3000)
node scripts/landing-visual-capture.mjs <outDir> [baseUrl]
```

Locked renderer settings — changing any of these will produce spurious diffs:

| setting | value |
|---|---|
| Browser | Playwright bundled Chromium **1223** (`chrome-mac-arm64` — "Google Chrome for Testing") |
| Executable | `~/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` (auto-resolved; override via `PLAYWRIGHT_BROWSERS_PATH`) |
| Playwright | `playwright-core@1.60.0` (from repo `node_modules`) |
| headless | `true` |
| viewport | `<width> x 900` (height fixed at 900) |
| deviceScaleFactor | `1` |
| fullPage | `true` |
| goto waitUntil | `networkidle` |
| animations | `"disabled"` (freezes CSS `@keyframes` at their initial frame) |
| caret | `"hide"` (hides blinking text cursors) |

Note: the chrome-devtools / Playwright MCP tools require a system Chrome stable
install that is absent on the capture machine; the script drives the same
Chromium engine directly so output is renderer-identical. Re-running the script
regenerates all 12 PNGs at identical pixel dimensions (verified).

## Determinism Fix (2026-06-25)

**Problem:** `page.screenshot()` was called without `animations` or `caret` options.
CSS `@keyframes` animations could be captured mid-frame (e.g. `animate-float`, `animate-shimmer`,
`animate-twinkle`) and blinking text cursors could appear in some captures but not others,
causing spurious pixel diffs on every re-run even when no code changed.

**Fix applied to `scripts/landing-visual-capture.mjs`:**

```js
await page.screenshot({ path: filePath, fullPage: FULL_PAGE, animations: "disabled", caret: "hide" });
```

- `animations: "disabled"` — Playwright freezes all CSS `@keyframes` animations at their
  first frame before the screenshot is taken.
- `caret: "hide"` — removes blinking text cursors from focused inputs.

## Diffing captured shots

**Tool used:** `pixelmatch` + `pngjs` (both in repo `node_modules`). Write a small ESM script
and call `pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0 })`.

**Alternative (if ImageMagick is available):**

```bash
compare -metric AE baseline/home-1440.png baseline2/home-1440.png null: 2>&1
```

**Expected values:** `~0 AE` for shots that capture static content (no CSS transitions
triggered by hover/open state). Shots that drive interactive states (hover, sidebar open,
FAQ expand) may retain low non-zero AE (~500–16000) due to CSS `transition` properties
(not covered by `animations: "disabled"`, which only freezes `@keyframes`) and sub-pixel
font rendering variation. These residual diffs are expected and stable — they do not grow
between re-runs of the same script version. **The fix eliminates the large unbounded AE that
animations-in-progress caused; residual AE is bounded and consistent.**

**Rule: any new migration phase PR that changes only the targeted section should produce
the same or lower AE on its relevant shots compared to the last captured baseline.**

## Shot List

| name | route | viewport | state steps |
|---|---|---|---|
| `home-1440` | `/` | 1440x900 | Navigate to route, no interaction |
| `home-768` | `/` | 768x900 | Navigate to route, no interaction |
| `home-390` | `/` | 390x900 | Navigate to route, no interaction |
| `home-1440-scrolled` | `/` | 1440x900 | window.scrollTo(0, 600) — nav enters scrolled state |
| `home-390-sidebar` | `/` | 390x900 | Clicked .nav-burger — sidebar opened |
| `home-1440-faq-open` | `/` | 1440x900 | Scrolled to FAQ section; clicked first FAQ question — expanded |
| `home-1440-cta-hover` | `/` | 1440x900 | Scrolled to CTA section; hovered primary CTA button |
| `home-1440-features` | `/` | 1440x900 | Scrolled to Features section; waited 2s for demos to settle |
| `waitlist-1440` | `/waitlist` | 1440x900 | Navigate to route, no interaction |
| `waitlist-390` | `/waitlist` | 390x900 | Navigate to route, no interaction |
| `access-1440` | `/access` | 1440x900 | Navigate to route, no interaction |
| `access-390` | `/access` | 390x900 | Navigate to route, no interaction |

## Concerns

None — all states driven successfully.

## Files

All PNGs saved to scratchpad (not committed).
Manifest committed to repo at `docs/superpowers/landing-baseline-manifest.md`.
Reusable capture script committed at `scripts/landing-visual-capture.mjs`.
