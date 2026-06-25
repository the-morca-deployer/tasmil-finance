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

- `animations: "disabled"` — Playwright finite-fast-forwards and disables CSS `@keyframes`
  animations and CSS `transition`s to a deterministic end state before the screenshot. This does
  NOT affect JavaScript-driven (`requestAnimationFrame`) animation — see "What … does NOT cover"
  below.
- `caret: "hide"` — removes blinking text cursors from focused inputs.

## Diffing captured shots

**Tool used:** `pixelmatch` + `pngjs` (both in repo `node_modules`). Write a small ESM script
and call `pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0 })`.

**Alternative (if ImageMagick is available):**

```bash
compare -metric AE baseline/home-1440.png baseline2/home-1440.png null: 2>&1
```

**What `animations: "disabled"` does and does NOT cover:** Playwright's `animations: "disabled"`
freezes CSS `@keyframes` and CSS `transition`s. It does NOT stop JavaScript-driven animation.
The landing page renders several demos animated by the `useLandingScripts` `requestAnimationFrame`
engine — the Partners ticker marquee, the Features demos (chat typing, swap USD calc, portfolio
chart, the auto-advancing position deck) and StellarReel. Because these are driven by JS rAF, not
CSS, each capture catches them at a different motion phase, so any **fullPage `/` shot** that
contains these regions has a high pixel-AE that **varies run-to-run by design.**

This was measured on 2026-06-25: three sequential `home-1440` fullPage captures of `/` (identical
code, dev server running) diffed pairwise with `pixelmatch` (threshold 0) gave AE of
**10,329 / 57,768 / 53,704** — i.e. the AE swings run-to-run; it is NOT a stable residual.
By contrast, the predominantly-static `/waitlist` and `/access` shots gave AE of ~3,445 / ~4,220.

**Therefore:**
- For any shot containing JS-animated regions (all fullPage `/` shots: `home-1440`, `home-768`,
  `home-390`, plus their scrolled/hover/FAQ/sidebar variants), **pixel-AE is a TRIAGE signal,
  not a pass/fail threshold.** A high or fluctuating AE there is expected and does not indicate a
  regression. These surfaces are verified by **visual comparison of layout, typography, color,
  spacing, and component structure** — animated content differing in motion phase is ignored.
- Predominantly-static surfaces (`/waitlist` and `/access` forms, footer, nav-at-rest) SHOULD
  show **low AE**. A large AE jump on one of those IS meaningful and worth investigating.

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
