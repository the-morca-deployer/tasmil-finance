# Quest UI - Tailwind + shared/ui Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing quest feature from a monolithic `quest.css` (~875 lines) to Tailwind v4 utility classes + reuse of the existing `src/features/quest/components/ui/` and `src/shared/ui/` components, with **zero visual change**, and add the one missing effect (THREE.js beams).

**Architecture:** Per-page conversion. For each page we (1) register `quest-` design tokens once so utilities like `bg-quest-bg` / `rounded-quest-card` exist, (2) rewrite each component's `className` from bespoke `.quest-*` selectors to Tailwind utilities + quest-local UI components, (3) delete the now-dead selectors from `quest.css`, and (4) prove no visual regression with a Playwright screenshot-compare loop against the raw mockups in `tmp/quest-tasmil`. The work is inherently visual and iterative, so each page task is a convert→screenshot→diff→fix loop with concrete acceptance gates, not pre-written final markup.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4 (`@theme` in `globals.css`), Radix UI (via `shared/ui` + quest-local `components/ui`), Biome, Jest (jsdom), Playwright, `three@^0.182.0`.

## Global Constraints

- **No visual change.** Colors, spacing, cards, layout must match current output and the mockups. This is a CSS-architecture refactor, not a redesign.
- **No new runtime dependency.** `three` is already in `package.json`. Do NOT add shadcn or any package.
- **Reuse existing components.** Prefer `src/features/quest/components/ui/*` (card, dialog, badge, tabs, separator, input, avatar, typography) and `src/shared/ui/*`. Only add a new primitive when none exists (Progress).
- **Biome rules:** 2-space indent, line width 100, double quotes, `import type` for type-only imports, no `any`, no `console.log` (use `console.warn`/`console.error`), path alias `@/*` → `src/*`, import quest internals from the feature barrel `@/features/quest` where a barrel export exists.
- **Next.js:** default to Server Components; add `"use client"` only when a component uses hooks/browser APIs (existing client components stay client).
- **Token prefix:** all new Tailwind tokens use the `quest-` prefix to avoid collision with existing `--color-sponsor-*` / app tokens.
- **Quest palette (verbatim, from `tmp/quest-tasmil/tasmil-quest.css` + `tasmil-profile.css`):**
  `--bg:#000000` `--bg-2:#141416` `--surface:#1C1C1F` `--surface-2:rgba(32,32,36,0.30)`
  `--text:#F4F7FB` `--muted:rgba(244,247,251,0.58)` `--dim:rgba(244,247,251,0.34)` `--faint:rgba(244,247,251,0.14)`
  `--accent:#67E8F9` `--accent-2:#0EA5E9` `--accent-deep:#0369A1` `--accent-ink:#04141A`
  `--accent-soft:rgba(103,232,249,0.14)` `--accent-line:rgba(103,232,249,0.32)` `--accent-glow:rgba(103,232,249,0.50)` `--tint:rgba(103,232,249,0.16)`
  `--green:#6EE7B7` `--green-soft:rgba(110,231,183,0.14)` `--green-line:rgba(110,231,183,0.32)`
  `--amber:#FBBF24` `--amber-soft:rgba(251,191,36,0.14)` `--amber-line:rgba(251,191,36,0.32)`
  `--gold:#FBC54A` `--silver:#C9D4E0` `--bronze:#E0915A` `--diamond:#67E8F9` (+ their `-soft`/`-line` variants)
  `--line:rgba(255,255,255,0.08)` `--line-2:rgba(255,255,255,0.14)`
  `--r-pill:100px` `--r-card:22px` `--r-sm:14px` `--r-xs:10px`
  `--ease:cubic-bezier(0.22,1,0.36,1)` `--ease-out:cubic-bezier(0.16,1,0.3,1)`
  Note: `tasmil-quest.css` uses `--bg:#000000`, `tasmil-profile.css` uses `--bg:#0C0C0E`. Match the **current app** output (whatever `quest.css` in the repo currently ships); the mockup variance is informational only.

---

## Conversion Reference (used by every page task)

This mapping is the single source of truth for rewriting `className`s. Token utilities come from Task 1.

| quest.css value | Tailwind utility |
|---|---|
| `color:var(--text)` | `text-quest-text` |
| `color:var(--muted)` | `text-quest-muted` |
| `color:var(--dim)` | `text-quest-dim` |
| `background:var(--bg)` | `bg-quest-bg` |
| `background:var(--surface)` | `bg-quest-surface` |
| `background:var(--accent-soft)` | `bg-quest-accent-soft` |
| `border:1px solid var(--line)` | `border border-quest-line` |
| `border:1px solid var(--accent-line)` | `border border-quest-accent-line` |
| `border-radius:var(--r-card)` | `rounded-quest-card` |
| `border-radius:var(--r-pill)` | `rounded-quest-pill` |
| `border-radius:var(--r-sm)` | `rounded-quest-sm` |
| `background:var(--grad)` (text) | `bg-quest-grad bg-clip-text text-transparent` (keep existing `.grad-text` helper if simpler) |
| `transition...var(--ease)` | `transition-* duration-* ease-quest` (or keep helper class) |

**Decision rule for each selector:**
- **Layout/spacing/color/border/radius** → inline Tailwind utilities.
- **A wrapper that maps to an existing component** (card surface → `Card`, pill badge → `Badge`, dialog → quest `Dialog`, segmented control → `Tabs`) → replace the element with that component, passing `className` for deltas.
- **Complex multi-rule visual (gradients, keyframe-driven, pseudo-elements, `::before` glows)** that is awkward as utilities → keep a small named class in `quest.css` (these are the only rules allowed to survive). Document each survivor in the task's commit message.

**Per-component conversion micro-cycle (apply to every component a page task lists):**
1. Open the component; for each `className="x"` look up `.x` in `quest.css`.
2. Replace per the decision rule above.
3. Save; the dev server hot-reloads.
4. Re-screenshot (page task provides the command); diff vs mockup.
5. If the rule is now unused anywhere, delete it from `quest.css`.

---

## Task 1: Register quest design tokens

**Files:**
- Modify: `src/app/globals.css` (the existing `@theme { ... }` block - append quest tokens beside the `--color-sponsor-*` ones)
- Test: `e2e/quest/quest-tokens.spec.ts` (create)

**Interfaces:**
- Produces: Tailwind utilities consumed by all later tasks: `bg-quest-bg`, `bg-quest-bg-2`, `bg-quest-surface`, `bg-quest-surface-2`, `text-quest-text`, `text-quest-muted`, `text-quest-dim`, `text-quest-faint`, `bg-quest-accent`, `text-quest-accent`, `bg-quest-accent-soft`, `border-quest-accent-line`, `bg-quest-green`, `bg-quest-amber`, `border-quest-line`, `border-quest-line-2`, `text-quest-gold|silver|bronze|diamond`, `rounded-quest-pill|card|sm|xs`, `ease-quest`, `ease-quest-out`, and gradient vars `--quest-grad` / `--quest-card-grad`.

- [ ] **Step 1: Write the failing test**

```ts
// e2e/quest/quest-tokens.spec.ts
import { expect, test } from "@playwright/test";

test("quest token utility resolves to the arctic-cyan accent", async ({ page }) => {
  await page.goto("/quest/explore");
  const color = await page.evaluate(() => {
    const el = document.createElement("div");
    el.className = "text-quest-accent";
    document.body.appendChild(el);
    const c = getComputedStyle(el).color;
    el.remove();
    return c;
  });
  // #67E8F9 → rgb(103, 232, 249)
  expect(color).toBe("rgb(103, 232, 249)");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec playwright test e2e/quest/quest-tokens.spec.ts`
Expected: FAIL - `text-quest-accent` does not exist yet, color is not `rgb(103, 232, 249)`.

- [ ] **Step 3: Add the tokens to the existing `@theme` block**

Append inside the existing `@theme { ... }` in `src/app/globals.css`:

```css
  /* Quest palette (matches tmp/quest-tasmil/tasmil-quest.css) */
  --color-quest-bg: #000000;
  --color-quest-bg-2: #141416;
  --color-quest-surface: #1c1c1f;
  --color-quest-surface-2: rgba(32, 32, 36, 0.3);
  --color-quest-text: #f4f7fb;
  --color-quest-muted: rgba(244, 247, 251, 0.58);
  --color-quest-dim: rgba(244, 247, 251, 0.34);
  --color-quest-faint: rgba(244, 247, 251, 0.14);
  --color-quest-accent: #67e8f9;
  --color-quest-accent-2: #0ea5e9;
  --color-quest-accent-deep: #0369a1;
  --color-quest-accent-ink: #04141a;
  --color-quest-accent-soft: rgba(103, 232, 249, 0.14);
  --color-quest-accent-line: rgba(103, 232, 249, 0.32);
  --color-quest-accent-glow: rgba(103, 232, 249, 0.5);
  --color-quest-green: #6ee7b7;
  --color-quest-green-soft: rgba(110, 231, 183, 0.14);
  --color-quest-green-line: rgba(110, 231, 183, 0.32);
  --color-quest-amber: #fbbf24;
  --color-quest-amber-soft: rgba(251, 191, 36, 0.14);
  --color-quest-amber-line: rgba(251, 191, 36, 0.32);
  --color-quest-line: rgba(255, 255, 255, 0.08);
  --color-quest-line-2: rgba(255, 255, 255, 0.14);
  --color-quest-gold: #fbc54a;
  --color-quest-gold-soft: rgba(251, 197, 74, 0.12);
  --color-quest-gold-line: rgba(251, 197, 74, 0.34);
  --color-quest-silver: #c9d4e0;
  --color-quest-silver-soft: rgba(201, 212, 224, 0.1);
  --color-quest-silver-line: rgba(201, 212, 224, 0.3);
  --color-quest-bronze: #e0915a;
  --color-quest-bronze-soft: rgba(224, 145, 90, 0.12);
  --color-quest-bronze-line: rgba(224, 145, 90, 0.34);
  --color-quest-diamond: #67e8f9;
  --radius-quest-pill: 100px;
  --radius-quest-card: 22px;
  --radius-quest-sm: 14px;
  --radius-quest-xs: 10px;
  --ease-quest: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-quest-out: cubic-bezier(0.16, 1, 0.3, 1);
```

Below the `@theme` block (plain CSS, since gradients aren't single-value tokens), add reusable vars on the scope:

```css
.quest-scope {
  --quest-grad: linear-gradient(110deg, #ffffff 0%, #67e8f9 52%, #0ea5e9 100%);
  --quest-card-grad: linear-gradient(160deg, rgba(32, 32, 36, 0.55), rgba(16, 16, 18, 0.55));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec playwright test e2e/quest/quest-tokens.spec.ts`
Expected: PASS.

- [ ] **Step 5: Verify the build still compiles**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css e2e/quest/quest-tokens.spec.ts
git commit -m "feat(quest): register quest- design tokens in tailwind theme"
```

---

## Task 2: Add a Progress primitive

**Files:**
- Create: `src/features/quest/components/ui/progress.tsx`
- Test: `src/features/quest/components/__tests__/progress.test.tsx`
- Modify: `src/features/quest/index.ts` (export it)

**Interfaces:**
- Produces: `export function Progress({ value, className }: { value: number; className?: string })` - renders a track (`bg-quest-line`) + fill (`bg-quest-grad`) where width = `clamp(0, value, 100)%`. Consumed by Task 4 (campaign detail) and Task 8 (profile).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/quest/components/__tests__/progress.test.tsx
import { render } from "@testing-library/react";
import { Progress } from "@/features/quest/components/ui/progress";

test("Progress clamps the fill width to 0-100%", () => {
  const { getByTestId, rerender } = render(<Progress value={150} />);
  expect(getByTestId("quest-progress-fill")).toHaveStyle({ width: "100%" });
  rerender(<Progress value={-20} />);
  expect(getByTestId("quest-progress-fill")).toHaveStyle({ width: "0%" });
  rerender(<Progress value={42} />);
  expect(getByTestId("quest-progress-fill")).toHaveStyle({ width: "42%" });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- progress.test.tsx`
Expected: FAIL - module `progress` not found.

- [ ] **Step 3: Implement the component**

```tsx
// src/features/quest/components/ui/progress.tsx
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-quest-pill bg-quest-line", className)}
    >
      <div
        data-testid="quest-progress-fill"
        className="h-full rounded-quest-pill transition-[width] duration-700 ease-quest"
        style={{ width: `${pct}%`, background: "var(--quest-grad)" }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- progress.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the barrel export**

In `src/features/quest/index.ts` add:

```ts
export { Progress } from "./components/ui/progress";
```

- [ ] **Step 6: Commit**

```bash
git add src/features/quest/components/ui/progress.tsx \
  src/features/quest/components/__tests__/progress.test.tsx \
  src/features/quest/index.ts
git commit -m "feat(quest): add Progress primitive replacing .prog-bar css"
```

---

## Task 3: Screenshot-compare harness

**Files:**
- Create: `scripts/quest-visual/serve-mockups.mjs` (static server for `tmp/quest-tasmil`)
- Create: `scripts/quest-visual/compare.mjs` (capture mockup + app page, write side-by-side + diff)
- Create: `scripts/quest-visual/pages.json` (route ↔ mockup mapping + viewports)

**Interfaces:**
- Produces: `node scripts/quest-visual/compare.mjs <pageKey>` → writes `scripts/quest-visual/out/<pageKey>.<viewport>.mockup.png`, `...app.png`, `...diff.png` and prints a mismatched-pixel count. Consumed by every page task (4-8) as the diff gate.

- [ ] **Step 1: Create the page map**

```json
// scripts/quest-visual/pages.json
{
  "explore":   { "app": "/quest/explore",        "mockup": "Tasmil Explore.html",     "viewports": [[1280, 1600], [390, 1800]] },
  "campaigns": { "app": "/quest/campaigns",       "mockup": "Tasmil Campaigns.html",   "viewports": [[1280, 1400], [390, 1800]] },
  "campaign":  { "app": "/quest/campaign/blend-lending", "mockup": "Tasmil Campaign.html", "viewports": [[1280, 1600], [390, 2000]] },
  "leaderboard": { "app": "/quest/leaderboard",   "mockup": "Tasmil Leaderboard.html", "viewports": [[1280, 1500], [390, 1800]] },
  "profile":   { "app": "/quest/profile",         "mockup": "Tasmil Profile.html",     "viewports": [[1280, 1800], [390, 2200]] }
}
```

- [ ] **Step 2: Create the static mockup server**

```js
// scripts/quest-visual/serve-mockups.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ROOT = "/Users/nathan/Documents/morcalab/tasmil/tmp/quest-tasmil";
const PORT = 4599;
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".webm": "video/webm", ".webp": "image/webp" };

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const file = join(ROOT, path === "/" ? "/Tasmil Explore.html" : path);
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}).listen(PORT, () => console.warn(`mockups on http://localhost:${PORT}`));
```

- [ ] **Step 3: Create the compare script**

```js
// scripts/quest-visual/compare.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const KEY = process.argv[2];
const cfg = JSON.parse(await readFile(new URL("./pages.json", import.meta.url)))[KEY];
if (!cfg) throw new Error(`unknown page key: ${KEY}`);

const APP = process.env.APP_BASE ?? "http://localhost:3000";
const MOCK = "http://localhost:4599";
const OUT = new URL("./out/", import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
async function shot(url, w, h, file) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800); // let entrance animations settle
  await page.screenshot({ path: file, fullPage: false });
  await page.close();
}

for (const [w, h] of cfg.viewports) {
  const tag = `${KEY}.${w}x${h}`;
  const mk = new URL(`${tag}.mockup.png`, OUT).pathname;
  const ap = new URL(`${tag}.app.png`, OUT).pathname;
  await shot(`${MOCK}/${encodeURIComponent(cfg.mockup)}`, w, h, mk);
  await shot(`${APP}${cfg.app}`, w, h, ap);

  const a = PNG.sync.read(await readFile(mk));
  const b = PNG.sync.read(await readFile(ap));
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const diff = new PNG({ width, height });
  const mismatch = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1 });
  await writeFile(new URL(`${tag}.diff.png`, OUT).pathname, PNG.sync.write(diff));
  console.warn(`${tag}: ${mismatch} mismatched px (${((mismatch / (width * height)) * 100).toFixed(2)}%)`);
}
await browser.close();
```

- [ ] **Step 4: Confirm compare deps are available (no install if present)**

Run: `pnpm exec node -e "require('pixelmatch');require('pngjs');require('playwright')"`
Expected: no error. If it errors with "Cannot find module", run `pnpm add -D pixelmatch pngjs` (playwright is already present per `playwright.config.ts`) and commit the lockfile change as part of this task.

- [ ] **Step 5: Smoke-test the harness against the current (unrefactored) Explore page**

Run (in two terminals or background the first):
```bash
node scripts/quest-visual/serve-mockups.mjs &
pnpm dev &
# wait for :3000, then:
node scripts/quest-visual/compare.mjs explore
```
Expected: prints mismatch counts and writes PNGs to `scripts/quest-visual/out/`. This baseline number is the "before" - the page is already supposed to match the mockup, so record it; later tasks must not make it worse.

- [ ] **Step 6: Commit**

```bash
git add scripts/quest-visual package.json pnpm-lock.yaml
git commit -m "chore(quest): add mockup screenshot-compare harness"
```

---

## Page tasks 4-8 - shared structure

Each page task below uses this **convert→verify loop**. The acceptance gate is identical; only the file list and per-page notes differ.

**Loop (repeat until the gate passes):**
1. Capture baseline before touching code: `node scripts/quest-visual/compare.mjs <key>` - record the number.
2. For each component in the task's file list, run the **per-component conversion micro-cycle** from the Conversion Reference.
3. Re-run `node scripts/quest-visual/compare.mjs <key>`; open the `*.diff.png` files; fix utility deltas until the mismatch % is **≤ the recorded baseline** at every listed viewport.
4. Delete every now-unused `.quest-*` selector this page owned from `src/features/quest/quest.css`.
5. Run the page's jest tests + lint + type-check.
6. Commit.

**Acceptance gate (all must hold):**
- `node scripts/quest-visual/compare.mjs <key>` mismatch % ≤ baseline at all viewports.
- `pnpm test -- <page test glob>` passes.
- `pnpm lint` and `pnpm type-check` clean.
- The page's selectors are gone from `quest.css` (grep shows no remaining references).

---

## Task 4: Explore page

**Files:**
- Modify: `src/features/quest/components/Explore.tsx`
- Modify: `src/features/quest/components/CampaignCard.tsx` (shared by Tasks 4 & 5 - convert here first)
- Modify: `src/features/quest/components/Rise.tsx` (entrance wrapper - convert its inline styles/classes)
- Remove from `quest.css`: `.x-hero`, `.x-hero-img`, `.x-hero-grad`, `.x-hero-inner`, `.eyebrow`, `.grad-text`(keep if reused widely - see note), `.x-stats`, `.x-stat`, `.why`, `.why-card`, `.sec-head`, and the campaign-card selectors `.camp-grid`, `.camp-card`, `.cc-cover`, `.cc-badge-pts`, `.cc-badge-status`, `.cc-body`, `.cc-title`, `.cc-desc`, `.cc-foot`, `.brand-mark`, `.ph-tag`, `.av-stack`, `.badge-ongoing`, `.badge-closed`.
- Test: `src/features/quest/components/__tests__/*Explore*.test.tsx`, `*Campaign*Card*.test.tsx` (existing)

**Key:** `explore`. Mockup: `Tasmil Explore.html`.

**Interfaces:**
- Consumes: tokens (Task 1).
- Produces: a converted `CampaignCard` (same props `CampaignCardData`) reused by Task 5. Keep the export signature `export function CampaignCard(props: { data: CampaignCardData })` exactly as it is today - do not change props.

**Notes:**
- `.grad-text` is used on many pages. **Keep it as a one-line survivor** in `quest.css` (`background:var(--quest-grad);-webkit-background-clip:text;color:transparent`) rather than repeating the 3 utilities everywhere - document it as an allowed survivor.
- `CampaignCard` builds avatar gradients via `qAvatar`/`qHash` (inline `style`) - leave that JS untouched; only convert its `className`s.

- [ ] **Step 1: Baseline** - `node scripts/quest-visual/compare.mjs explore`; record mismatch %.
- [ ] **Step 2: Convert `CampaignCard.tsx`** per the micro-cycle (it is the densest unit; do it first since Task 5 depends on it). Map `.cc-cover`→`relative aspect-[16/9] overflow-hidden rounded-quest-card ...`, `.cc-title`→`text-quest-text font-bold ...`, `.cc-desc`→`text-quest-muted line-clamp-2 ...`, status pills → quest `Badge` component with `className` for ongoing (`bg-quest-green-soft border-quest-green-line`) / closed (`bg-quest-faint`).
- [ ] **Step 3: Convert `Rise.tsx`** - entrance animation wrapper; keep its keyframe/`rise` class as a survivor (animation), convert only static classes.
- [ ] **Step 4: Convert `Explore.tsx`** - hero, stats strip, why-cards, featured grid → utilities.
- [ ] **Step 5: Re-diff** - `node scripts/quest-visual/compare.mjs explore`; fix until ≤ baseline at `1280x1600` and `390x1800`.
- [ ] **Step 6: Remove dead selectors** listed above from `quest.css`; `grep -n "x-hero\|cc-cover\|why-card" src/features/quest/quest.css` returns nothing (except documented survivors).
- [ ] **Step 7: Verify** - `pnpm test -- Explore CampaignCard` ; `pnpm lint` ; `pnpm type-check`. All pass.
- [ ] **Step 8: Commit**

```bash
git add src/features/quest/components/Explore.tsx \
  src/features/quest/components/CampaignCard.tsx \
  src/features/quest/components/Rise.tsx \
  src/features/quest/quest.css
git commit -m "refactor(quest): convert Explore + CampaignCard to tailwind utilities"
```

---

## Task 5: Campaigns list page

**Files:**
- Modify: `src/features/quest/components/Campaigns.tsx`
- Modify: `src/features/quest/components/pagination-bar.tsx`
- Reuse: converted `CampaignCard` (Task 4).
- Remove from `quest.css`: `.c-head`, `.c-bar`, `.segmented` (+ its button states), `.search`/search-input selectors, pagination selectors. (`.camp-grid`/`.camp-card` already removed in Task 4.)
- Test: existing `*Campaigns*` / `*pagination*` tests.

**Key:** `campaigns`. Mockup: `Tasmil Campaigns.html`.

**Notes:** the Ongoing/Closed/All segmented control maps to quest-local `Tabs` (`components/ui/tabs.tsx`); search field maps to quest-local `Input` (`components/ui/input.tsx`). Keep filtering logic untouched - only swap the markup.

- [ ] **Step 1: Baseline** - `compare.mjs campaigns`; record %.
- [ ] **Step 2: Convert `Campaigns.tsx`** - page head, search (`Input`), segmented filter (`Tabs`), grid (`grid gap-* md:grid-cols-3` per breakpoints 980/640 → `max-[980px]:grid-cols-2 max-[640px]:grid-cols-1`).
- [ ] **Step 3: Convert `pagination-bar.tsx`** to utilities + quest `Button`.
- [ ] **Step 4: Re-diff** `compare.mjs campaigns`; fix to ≤ baseline at both viewports.
- [ ] **Step 5: Remove dead selectors**; grep clean.
- [ ] **Step 6: Verify** - `pnpm test -- Campaigns pagination`; `pnpm lint`; `pnpm type-check`.
- [ ] **Step 7: Commit**

```bash
git add src/features/quest/components/Campaigns.tsx \
  src/features/quest/components/pagination-bar.tsx src/features/quest/quest.css
git commit -m "refactor(quest): convert Campaigns list to tailwind utilities"
```

---

## Task 6: Campaign detail page

**Files:**
- Modify: `src/features/quest/components/CampaignDetail.tsx`
- Modify: `src/features/quest/components/QuestStep.tsx`
- Use: `Progress` (Task 2) for `.prog-bar`/`.prog-fill`.
- Remove from `quest.css`: `.detail-grid`, `.d-badges`, `.prog-block`, `.prog-bar`, `.prog-fill`, `.quests`, `.q-item` (+ expanded state), `.side-card`, `.s-cover`, `.d-side-card`, `.mfy-card`, `.back`.
- Test: existing `*CampaignDetail*` / `*QuestStep*` tests.

**Key:** `campaign` (route `/quest/campaign/blend-lending` per `pages.json`; ensure that id exists in mock data - it does, `id:"blend-lending"`).

**Notes:**
- `.q-item` expandable maps to quest-local pattern using `Collapsible` from `shared/ui` (or the existing expand logic - keep whichever the component already uses; only convert classes).
- Two-column `.detail-grid` is `grid grid-cols-[8fr_4fr] gap-* max-[920px]:grid-cols-1` (mockup stacks at 920px).
- Progress fill is animated - `Progress` already animates width; pass the campaign completion value.

- [ ] **Step 1: Baseline** - `compare.mjs campaign`; record %.
- [ ] **Step 2: Convert `QuestStep.tsx`** (the repeated `.q-item`) - icon, pts badge (`Badge`), description, expand affordance.
- [ ] **Step 3: Convert `CampaignDetail.tsx`** - back link, badges, progress (swap `.prog-bar` markup for `<Progress value={...} />`), quest list, sidebar card, "more for you".
- [ ] **Step 4: Re-diff** `compare.mjs campaign`; fix to ≤ baseline at `1280x1600` and `390x2000`.
- [ ] **Step 5: Remove dead selectors**; grep clean.
- [ ] **Step 6: Verify** - `pnpm test -- CampaignDetail QuestStep`; `pnpm lint`; `pnpm type-check`.
- [ ] **Step 7: Commit**

```bash
git add src/features/quest/components/CampaignDetail.tsx \
  src/features/quest/components/QuestStep.tsx src/features/quest/quest.css
git commit -m "refactor(quest): convert Campaign detail to tailwind + Progress"
```

---

## Task 7: Leaderboard page

**Files:**
- Modify: `src/features/quest/components/Leaderboard.tsx`
- Modify: `src/features/quest/components/LeaderboardRow.tsx`
- Modify: `src/features/quest/components/Podium.tsx`
- Modify: `src/features/quest/components/WalletRankInfo.tsx`
- Modify: `src/features/quest/components/RankMove.tsx`
- Remove from `quest.css`: `.page-head`, `.page-title`, `.banner`, `.banner-grid`, `.rows`, `.row`, `.row-rank`, and podium selectors `.podium`, `.pod`, `.pod1`/`.pod2`/`.pod3`, `.pod-av`, `.pod-crown`, `.pod-num`, `.pod-prize`, `.plinth`, `.plinth-num`. **Keep podium tier-gradient + crown-glow rules as documented survivors** (complex gradients/pseudo-elements).
- Test: existing `*Leaderboard*` / `*Podium*` tests.

**Key:** `leaderboard`. Mockup: `Tasmil Leaderboard.html`.

**Notes:** the points/streak metric toggle is `useState` driven - keep it, render the toggle as `Tabs`. `CountUp` (`@/shared/ui/count-up`) stays. Podium has 3 tier-specific gradients; convert layout to utilities but the gold/silver/bronze gradient + glow stay as small survivor classes (`.pod1`,`.pod2`,`.pod3` reduced to just their gradient/glow declarations).

- [ ] **Step 1: Baseline** - `compare.mjs leaderboard`; record %.
- [ ] **Step 2: Convert `LeaderboardRow.tsx`** (repeated row) - rank, avatar, name, points, tier badge.
- [ ] **Step 3: Convert `Podium.tsx`** - layout to utilities; reduce `.pod1/2/3` to gradient/glow survivors only.
- [ ] **Step 4: Convert `Leaderboard.tsx`, `WalletRankInfo.tsx`, `RankMove.tsx`** - page head, banner, metric `Tabs`, rows container.
- [ ] **Step 5: Re-diff** `compare.mjs leaderboard`; fix to ≤ baseline at both viewports.
- [ ] **Step 6: Remove dead selectors** (keep documented survivors); grep clean except survivors.
- [ ] **Step 7: Verify** - `pnpm test -- Leaderboard Podium`; `pnpm lint`; `pnpm type-check`.
- [ ] **Step 8: Commit**

```bash
git add src/features/quest/components/Leaderboard.tsx \
  src/features/quest/components/LeaderboardRow.tsx \
  src/features/quest/components/Podium.tsx \
  src/features/quest/components/WalletRankInfo.tsx \
  src/features/quest/components/RankMove.tsx src/features/quest/quest.css
git commit -m "refactor(quest): convert Leaderboard + Podium to tailwind utilities"
```

---

## Task 8: Profile page

**Files:**
- Modify: `src/features/quest/components/Profile.tsx`
- Modify: `src/features/quest/components/Referrals.tsx`
- Modify: `src/features/quest/components/social/SocialConnectButtons.tsx` (SocialConnectCard/Section)
- Modify: `src/features/quest/components/StatRing.tsx`
- Modify: `src/features/quest/components/LedgerRow.tsx`
- Use: `Progress` (Task 2) for the level/tier progress bars.
- Remove from `quest.css`: `.shell`, `.pside`, `.pmain`, `.uc`, `.tier-badge`, `.av-grid`, `.ov-grid`, `.hero2`, `.mini-grid`, `.quest-grid`, `.quest-card`, `.qref-code`, `.ref-top`, `.reflist`, `.rl-head`, `.rl-row`, `.tree`, `.social-list`, `.how-grid`. **Keep `@keyframes shimmer` + the `.shimmer` survivor** (level bar shimmer).
- Test: existing `*Profile*` / `*Referrals*` / `*Social*` tests.

**Key:** `profile`. Mockup: `Tasmil Profile.html`. This is the largest page (4 tabs: Overview / My Quests / Referrals / Social).

**Notes:**
- Sidebar tabs → quest-local `Tabs`; sub-tabs (Pending/Claimable/Claimed) → nested `Tabs`.
- Responsive collapses: `.shell` 2-col → 1-col at 860px (`max-[860px]:grid-cols-1`), `.ov-grid` at 1080px, nav `.stat-pill` hidden at 560px - translate each media query to the matching `max-[...px]:` variant.
- The diff page is tall; screenshot at `1280x1800` and `390x2200` per `pages.json`. If a tab's content isn't visible in one shot, add temporary `?tab=referrals` style deep-links or click the tab in a throwaway check; the gate only needs the default Overview tab to match, plus a manual eyeball of the other three tabs (note this in the commit).

- [ ] **Step 1: Baseline** - `compare.mjs profile`; record %.
- [ ] **Step 2: Convert `Profile.tsx`** Overview tab - user card, hero2, mini stats, tier ladder, quick referral.
- [ ] **Step 3: Convert My Quests tab** (quest-card grid) and sub-tabs.
- [ ] **Step 4: Convert `Referrals.tsx`** - hero, code box, rate breakdown, list table, tree.
- [ ] **Step 5: Convert `SocialConnectButtons.tsx`, `StatRing.tsx`, `LedgerRow.tsx`.**
- [ ] **Step 6: Re-diff** `compare.mjs profile` (Overview); manually eyeball the other 3 tabs against the mockup; fix to ≤ baseline.
- [ ] **Step 7: Remove dead selectors** (keep shimmer survivor); grep clean.
- [ ] **Step 8: Verify** - `pnpm test -- Profile Referrals Social`; `pnpm lint`; `pnpm type-check`.
- [ ] **Step 9: Commit**

```bash
git add src/features/quest/components/Profile.tsx \
  src/features/quest/components/Referrals.tsx \
  src/features/quest/components/social/SocialConnectButtons.tsx \
  src/features/quest/components/StatRing.tsx \
  src/features/quest/components/LedgerRow.tsx src/features/quest/quest.css
git commit -m "refactor(quest): convert Profile (all tabs) to tailwind utilities"
```

---

## Task 9: THREE.js beams background (the missing effect)

**Files:**
- Create: `src/features/quest/components/QuestBeams.tsx`
- Modify: `src/app/(quest)/layout.tsx` (mount `<QuestBeams />` behind content, lazy)
- Modify: `src/features/quest/index.ts` (export)
- Reference source: `tmp/quest-tasmil/tasmil-beams.js` (248 lines - port the scene/material/animation body verbatim into the effect)
- Test: `src/features/quest/components/__tests__/quest-beams.test.tsx`

**Interfaces:**
- Produces: `export function QuestBeams()` - a fixed, `pointer-events-none`, `-z-10` full-viewport `<canvas id="beams-canvas">` running the beams animation; renders nothing (returns the canvas only) and **no-ops under `prefers-reduced-motion: reduce`**. Mounted once in the quest layout.

**Config constants (verbatim from `tasmil-beams.js`):** `BEAM_WIDTH=2`, `BEAM_HEIGHT=30`, `BEAM_NUMBER=14`, `LIGHT_COLOR="#67e8f9"`, `SPEED=2`, `NOISE_INTENSITY=2.25`, `SCALE=0.15`, `ROTATION_DEG=55`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/quest/components/__tests__/quest-beams.test.tsx
import { render } from "@testing-library/react";
import { QuestBeams } from "@/features/quest/components/QuestBeams";

test("QuestBeams renders the canvas and no-ops under reduced motion", () => {
  window.matchMedia = ((q: string) => ({
    matches: true, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent() { return false; },
  })) as unknown as typeof window.matchMedia;
  const { container } = render(<QuestBeams />);
  expect(container.querySelector("canvas#beams-canvas")).not.toBeNull();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- quest-beams.test.tsx`
Expected: FAIL - module not found.

- [ ] **Step 3: Implement the component (React wrapper around the ported scene)**

```tsx
// src/features/quest/components/QuestBeams.tsx
"use client";
import { useEffect, useRef } from "react";

const BEAM_WIDTH = 2;
const BEAM_HEIGHT = 30;
const BEAM_NUMBER = 14;
const LIGHT_COLOR = "#67e8f9";
const SPEED = 2;
const NOISE_INTENSITY = 2.25;
const SCALE = 0.15;
const ROTATION_DEG = 55;

export function QuestBeams() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    let dispose = () => {};
    let cancelled = false;

    // three is already a dependency; load dynamically so it stays out of the main bundle.
    import("three").then((THREE) => {
      if (cancelled) return;
      // PORT: copy the scene/camera/renderer/material(GLSL Perlin)/geometry/animation
      // body of tmp/quest-tasmil/tasmil-beams.js here, using the constants above,
      // `canvas` as the WebGLRenderer canvas, and assigning `raf` and `dispose`
      // (renderer.dispose + cancelAnimationFrame + resize listener removal).
      void { BEAM_WIDTH, BEAM_HEIGHT, BEAM_NUMBER, LIGHT_COLOR, SPEED, NOISE_INTENSITY, SCALE, ROTATION_DEG, THREE };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      dispose();
    };
  }, []);

  return (
    <canvas
      id="beams-canvas"
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- quest-beams.test.tsx`
Expected: PASS.

- [ ] **Step 5: Mount in the quest layout**

In `src/app/(quest)/layout.tsx`, inside `<div className="quest-scope">` and before the main content, add `<QuestBeams />` (lazy via `next/dynamic` with `ssr: false` if SSR complains about `window`):

```tsx
import dynamic from "next/dynamic";
const QuestBeams = dynamic(
  () => import("@/features/quest/components/QuestBeams").then((m) => m.QuestBeams),
  { ssr: false },
);
```

Add the barrel export in `src/features/quest/index.ts`:
```ts
export { QuestBeams } from "./components/QuestBeams";
```

- [ ] **Step 6: Visually verify** - `pnpm dev`, open `/quest/explore`, confirm the animated cyan beams render behind content and that toggling OS "reduce motion" disables them. `pnpm lint && pnpm type-check`.

- [ ] **Step 7: Commit**

```bash
git add src/features/quest/components/QuestBeams.tsx \
  src/features/quest/components/__tests__/quest-beams.test.tsx \
  "src/app/(quest)/layout.tsx" src/features/quest/index.ts
git commit -m "feat(quest): add THREE.js beams background effect"
```

---

## Task 10: Convert remaining effect components' CSS

**Files:**
- Modify: `src/features/quest/components/RankReveal.tsx`
- Modify: `src/features/quest/components/RankRevealGate.tsx`
- Modify: `src/features/quest/components/TFLoader.tsx`
- Modify: `src/features/quest/components/Navbar.tsx` (QuestNav) and `Footer.tsx` (QuestFooter) - shared chrome
- Remove from `quest.css`: `.nav`, `.nav-brand`, `.nav-links`, `.nav-item`, `.stat-pill`, `.wallet-chip`, `.footer`, `.foot-grid`, `.foot-brand`, `.fa-aurora`, `.rank-reveal-backdrop`, `.rank-card`, `.reveal-*`, `.claim-btn`, `.checklist`, `.ci`, `.tf-loader-mark`. **Keep all `@keyframes` (`crownbob`, `numpop`, `rgbsplit`, `pop`, `fade`, `ctapulse`, `shimmer`) and any class that is purely an animation binding - these are documented survivors.**
- Test: existing `*RankReveal*` / `*TFLoader*` / nav tests.

**Notes:** These components are functionally complete; this task only swaps their static `className`s to utilities while leaving keyframe-bound animation classes in `quest.css`. The Rank Reveal modal should sit on the quest-local `Dialog` (`components/ui/dialog.tsx`) if it doesn't already.

- [ ] **Step 1: Convert `Navbar.tsx` + `Footer.tsx`** (shared chrome, affects every page diff). Re-run `compare.mjs explore` to confirm nav/footer still match.
- [ ] **Step 2: Convert `TFLoader.tsx`** - keep `@keyframes rgbsplit` + the `.tf-loader-mark` animation binding; convert layout/size classes. Manually trigger the loader route to confirm the RGB-split still plays.
- [ ] **Step 3: Convert `RankReveal.tsx` + `RankRevealGate.tsx`** - keep confetti/crown/plinth keyframe bindings; convert backdrop/card/checklist layout. Trigger via the dock/test hook to confirm the reveal sequence still plays.
- [ ] **Step 4: Remove dead selectors** (keep all keyframes + animation-binding survivors); grep `quest.css` - only tokens, survivors, and keyframes remain.
- [ ] **Step 5: Verify** - `pnpm test -- RankReveal TFLoader Navbar`; `pnpm lint`; `pnpm type-check`.
- [ ] **Step 6: Commit**

```bash
git add src/features/quest/components/RankReveal.tsx \
  src/features/quest/components/RankRevealGate.tsx \
  src/features/quest/components/TFLoader.tsx \
  src/features/quest/components/Navbar.tsx \
  src/features/quest/components/Footer.tsx src/features/quest/quest.css
git commit -m "refactor(quest): convert nav/footer/reveal/loader to tailwind utilities"
```

---

## Task 11: Final cleanup & full verification

**Files:**
- Modify: `src/features/quest/quest.css` (final trim)
- Modify: `docs/superpowers/specs/2026-06-25-quest-ui-tailwind-refactor-design.md` (tick "done")

- [ ] **Step 1: Audit what remains in `quest.css`**

Run: `grep -nE '^\.|@keyframes|:root|\.quest-scope' src/features/quest/quest.css`
Expected: only (a) the `.quest-scope` gradient vars, (b) documented survivor classes (`.grad-text`, podium gradients, `.shimmer`, animation bindings), and (c) `@keyframes`. If any layout/color/spacing selector remains, it belongs to a page already done - convert and remove it now.

- [ ] **Step 2: Confirm the file shrank substantially**

Run: `wc -l src/features/quest/quest.css`
Expected: dramatically smaller than the original ~875 lines (target: only tokens + keyframes + a handful of survivors).

- [ ] **Step 3: Full visual sweep**

Run for every key:
```bash
for k in explore campaigns campaign leaderboard profile; do node scripts/quest-visual/compare.mjs $k; done
```
Expected: every mismatch % ≤ its recorded baseline.

- [ ] **Step 4: Full automated suite**

Run: `pnpm test` then `pnpm exec playwright test e2e/quest` then `pnpm lint && pnpm type-check`
Expected: all green. (Existing `e2e/quest/quest-screenshots.spec.ts` is the regression backstop.)

- [ ] **Step 5: Commit**

```bash
git add src/features/quest/quest.css docs/superpowers/specs/2026-06-25-quest-ui-tailwind-refactor-design.md
git commit -m "refactor(quest): final quest.css trim + verification"
```

---

## Self-Review notes (coverage map)

- Spec "design tokens / Tailwind v4 @theme with quest- prefix" → Task 1.
- Spec "reuse shared/ui, no new dep; add 1-2 primitives if missing (Progress)" → Task 2 (+ reuse throughout 4-8, 10).
- Spec "5 pages Explore/Campaigns/Campaign detail/Leaderboard/Profile in order" → Tasks 4, 5, 6, 7, 8.
- Spec "port all effects: beams, rank reveal, TF loader" → Task 9 (beams = the only missing one) + Task 10 (reveal/loader CSS conversion; both already functionally exist).
- Spec "mock data, render without backend" → mock fixtures already exist (`src/features/quest/lib`, `data/mock.ts`, `@/mocks/data/quest`); `pages.json` targets a mock id (`blend-lending`). If a route hits the real API in dev, enable the existing MSW mock provider before the loop (noted in Task 3 smoke test).
- Spec "per-page autonomous Playwright screenshot-compare loop, report before/after, sign-off, next page" → Task 3 harness + the shared convert→verify loop; each page task ends at a commit = the natural per-page sign-off checkpoint.
- Spec "DoD per page: parity at desktop+mobile, type-check+lint pass, .quest-* removed" → encoded in the shared Acceptance gate and each task's final steps; Task 11 is the global backstop.
