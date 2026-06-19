# Phase 1: Landing + Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the full redesigned landing page from `tasmil-finance-new` into `tasmil-finance` at `/`, with a unified theme/provider/font shell, and wire the waitlist + access-code gate (incl. admin access-codes UI) to the backend.

**Architecture:** This is a **port**, not greenfield. The redesigned landing UI already exists in `tasmil-finance-new/src`. We relocate its components into `tasmil-finance/src/features/landing` (+ `features/access`, `features/waitlist`, `features/admin`), rewrite import paths to the target's conventions, scope landing CSS so it never leaks into app/quest bundles, and mount it under the existing `(landing-page)` route group (which inherits the target root layout's `AppProvider`). The waitlist/access/admin API routes and `shared/ui` primitives already exist in the target.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Biome, Tailwind v4, `three`/`@react-three/fiber`/`gsap`/`motion` (landing 3D), `@tanstack/react-query`, `zustand`, `jose`, kubb-generated `gen-backend` client, Playwright (e2e), Jest (unit).

## Global Constraints

- Biome formatting: 2-space indent, line width 100, double quotes. Run `pnpm check:fix` before every commit.
- `import type` for type-only imports; **no `any`**; **no `console.log`** (use `console.warn`/`console.error`).
- Default to Server Components; add `"use client"` only when needed.
- Path alias `@/*` → `src/*`. Import from feature barrels (`@/features/landing`), not deep sub-paths, from outside the feature.
- Features must never import from other features; cross-cutting code lives in `src/shared/`.
- **Never edit `src/gen-ai/` or `src/gen-backend/` by hand** — they are kubb-generated.
- **English only** in all UI copy and source strings.
- `pnpm build` must exit 0 locally before any push. **Never push directly to `deploy/prod` or `deploy/staging`** — feature branch → PR → merge.
- **Branching:** cut the feature branch from `origin/deploy/staging` and open the PR back into `deploy/staging` (NOT `deploy/prod`). The local `main` is stale (behind `origin/deploy/staging`); always base on `origin/deploy/staging`.
- Work on branch `feat/merge-landing-quest` (already created from `origin/deploy/staging`).
- Source repo paths below are relative to the workspace root `/Users/nathan/Documents/morcalab/tasmil`. The target repo is `tasmil-finance/`.

## File map (what this phase creates/modifies in `tasmil-finance/`)

| Path | Responsibility |
|------|----------------|
| `src/app/layout.tsx` (modify) | Add landing fonts (`--font-sans` Hanken Grotesk, `--font-mono` Geist Mono) as extra CSS-var fonts alongside existing `--font-outfit`. |
| `src/features/landing/landing.css` (create) | Landing-only styles (`.wl-page`, accent vars, keyframes) scoped to landing surfaces; imported only by the landing layout. |
| `src/features/landing/components/*` (create/replace) | Redesigned landing components (`LandingClient`, `Hero`, `Nav`, `Footer`, `Faq`, `Features`, `Fees`, `Security`, `Partners`, `Convergence`, `Statement`, `StellarReel`, `Preloader`, `Sidebar`, `Backdrop`, `Cta`, `Experience`, `VoidCore`, `GlassHex`, `FloatingShapes`, `LandingBackground`, `3d/AbstractCube`, `useLandingScripts`) + landing-only support (`animations/*`, `layout/*`, `ui/stepper`, `wl/*`). |
| `src/features/landing/index.ts` (replace) | Landing feature barrel. |
| `src/features/waitlist/*` (create) | Waitlist multi-screen flow + hooks/lib. |
| `src/features/access/*` (create) | Wallet-connect + access-code redeem flow + hook. |
| `src/features/admin/hooks/*` (create) | `use-admin-auth`, `use-admin-codes` (redesigned admin access-codes). |
| `src/store/{use-wallet,use-auth,use-admin-auth}.ts` (create if missing) | zustand stores the ported features import. |
| `src/lib/env.ts` (create if missing) | Typed env accessor used by ported features. |
| `src/shared/constants/routes.ts` (create if missing) | Route constants used by landing nav/access. |
| `src/app/(landing-page)/layout.tsx` (create) | Landing route-group layout: imports `landing.css`, sets landing metadata. |
| `src/app/(landing-page)/page.tsx` (replace stub) | Renders `LandingClient` (3D dynamically imported). |
| `src/app/(landing-page)/waitlist/page.tsx` (create) | Waitlist route. |
| `src/app/(landing-page)/access/page.tsx` (create) | Access route. |
| `src/app/admin/access-codes/page.tsx` + `src/app/admin/login/page.tsx` (create) | Admin access-codes UI (redesigned). |
| `e2e/landing.smoke.spec.ts` (create) | Playwright smoke for landing/waitlist/access. |

> The waitlist/access/admin-codes/admin-auth **API routes already exist** in `tasmil-finance/src/app/api/` and are reused unchanged. `shared/ui` primitives (`button`, `button-v2`, `badge`, `card`, `input`, `label`, `tooltip`, `typography`, `scroll-based-velocity`), `lib/utils`, `shared/context/wallet-context`, and `jose` already exist in the target — do not recreate them.

---

### Task 1: Foundation — deps, fonts, scoped CSS, stores/env/constants

Cross-cutting prerequisites every later task depends on. Deliverable: the app still builds, and the ported features' non-UI dependencies (fonts, CSS file, stores, env, route constants) resolve.

**Files:**
- Modify: `tasmil-finance/src/app/layout.tsx`
- Create: `tasmil-finance/src/features/landing/landing.css`
- Create (if missing): `tasmil-finance/src/store/use-wallet.ts`, `use-auth.ts`, `use-admin-auth.ts`
- Create (if missing): `tasmil-finance/src/lib/env.ts`
- Create (if missing): `tasmil-finance/src/shared/constants/routes.ts`

**Interfaces:**
- Produces: CSS vars `--font-sans`, `--font-mono` on `<html>`; `src/features/landing/landing.css`; zustand stores at `@/store/*`; `@/lib/env` (`env` object); `@/shared/constants/routes` (`ROUTES` constant).

- [ ] **Step 1: Confirm `jose` is installed**

Run: `cd tasmil-finance && grep -c "\"jose\"" package.json || true`
If it prints `0`, run: `pnpm add jose@^6`
Expected: `jose` present in `package.json` dependencies (lockfile already contains `jose@`).

- [ ] **Step 2: Add landing fonts to the root layout**

Edit `tasmil-finance/src/app/layout.tsx`. Add the Google-font imports and variables next to the existing `localFont` (Outfit), and append their variables to the `<html>` className. Keep `--font-outfit` as the app font; landing CSS uses `--font-sans`/`--font-mono`.

```tsx
import { Geist_Mono, Hanken_Grotesk } from "next/font/google";
// ...existing imports...

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
```

Then change the `<html>` className from:
```tsx
<html className={`${outfit.variable}`} lang="en" suppressHydrationWarning>
```
to:
```tsx
<html
  className={`${outfit.variable} ${hanken.variable} ${geistMono.variable}`}
  lang="en"
  suppressHydrationWarning
>
```

- [ ] **Step 3: Create scoped landing CSS**

Copy `tasmil-finance-new/src/app/globals.css` to `tasmil-finance/src/features/landing/landing.css`, then **delete** from the copy: the top `@import "tailwindcss";` line and the base design-token `:root { --background … }` block (the target's `src/app/globals.css` already owns Tailwind + the design tokens). Keep all landing-specific selectors (`.wl-page`, `[data-grid]`, `[data-motion]`, `.shake`, accent variables, `@keyframes`).

Verify it contains no `@import "tailwindcss"`:
Run: `grep -c '@import "tailwindcss"' tasmil-finance/src/features/landing/landing.css`
Expected: `0`

- [ ] **Step 4: Port stores, env, and route constants**

Copy these files verbatim from source, then fix imports to target conventions in Step 5 of later tasks as needed:
```bash
cd /Users/nathan/Documents/morcalab/tasmil
for f in use-wallet use-auth use-admin-auth; do
  [ -f tasmil-finance/src/store/$f.ts ] || cp tasmil-finance-new/src/store/$f.ts tasmil-finance/src/store/$f.ts
done
mkdir -p tasmil-finance/src/shared/constants
[ -f tasmil-finance/src/lib/env.ts ] || cp tasmil-finance-new/src/lib/env.ts tasmil-finance/src/lib/env.ts
[ -f tasmil-finance/src/shared/constants/routes.ts ] || cp tasmil-finance-new/src/shared/constants/routes.ts tasmil-finance/src/shared/constants/routes.ts
```
Open each copied file and confirm every `@/...` import it uses resolves in the target (they reference `@/lib/utils`, `@/shared/context/wallet-context`, both of which exist). Fix any that don't.

- [ ] **Step 5: Format, type-check, build**

Run:
```bash
cd tasmil-finance && pnpm check:fix && pnpm type-check && pnpm build
```
Expected: Biome clean, `tsc` no errors, build exits 0. (`landing.css` is not imported yet, so no visual change.)

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance && git add -A && git commit -m "chore(landing): add fonts, scoped landing.css, stores/env/constants foundation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Relocate landing support components

Move the landing-only support modules (`animations`, `layout`, `ui/stepper`, `wl`) that live under `tasmil-finance-new/src/components/*` into the landing feature, since the target has no top-level `src/components/`. Deliverable: these modules exist in the target and type-check in isolation.

**Files:**
- Create: `tasmil-finance/src/features/landing/components/animations/{beams-canvas,beams,bg-fx,svg-anims}.tsx`
- Create: `tasmil-finance/src/features/landing/components/layout/{footer,nav}.tsx`
- Create: `tasmil-finance/src/features/landing/components/ui/stepper.tsx`
- Create: `tasmil-finance/src/features/landing/components/wl/{access,landing,shared}.tsx`, `wl/beams.ts`

**Interfaces:**
- Produces: support components under `@/features/landing/components/{animations,layout,ui,wl}/*`.

- [ ] **Step 1: Copy the support modules**

```bash
cd /Users/nathan/Documents/morcalab/tasmil
D=tasmil-finance/src/features/landing/components
mkdir -p $D/animations $D/layout $D/ui $D/wl
cp tasmil-finance-new/src/components/animations/* $D/animations/
cp tasmil-finance-new/src/components/layout/* $D/layout/
cp tasmil-finance-new/src/components/ui/stepper.tsx $D/ui/
cp tasmil-finance-new/src/components/wl/* $D/wl/
```

- [ ] **Step 2: Rewrite imports in the copied files**

Apply this mapping to every copied file (these are the only prefixes used by the landing support set, confirmed via grep):

| Source import prefix | Target replacement |
|----------------------|--------------------|
| `@/components/animations/` | `@/features/landing/components/animations/` |
| `@/components/layout/` | `@/features/landing/components/layout/` |
| `@/components/ui/` | `@/features/landing/components/ui/` |
| `@/components/wl/` | `@/features/landing/components/wl/` |
| `@/shared/ui/...` | unchanged (exists in target) |
| `@/lib/utils` | unchanged (exists) |
| `@/shared/context/...` | unchanged (exists) |
| `@/shared/constants/routes` | unchanged (created in Task 1) |
| `@/features/access`, `@/features/waitlist` | unchanged (created in Tasks 6–7; may show as unresolved until then) |

Run a sweep to find any remaining `@/components/`:
Run: `grep -rn "@/components/" tasmil-finance/src/features/landing || echo "none"`
Expected: `none`.

- [ ] **Step 3: Format + type-check (expect known forward-refs only)**

Run: `cd tasmil-finance && pnpm check:fix && pnpm type-check 2>&1 | grep -E "error" | grep -v "features/access\|features/waitlist" || echo "no unexpected errors"`
Expected: `no unexpected errors` (errors referencing not-yet-created `features/access` / `features/waitlist` are acceptable here and resolved in Tasks 6–7).

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance && git add -A && git commit -m "feat(landing): relocate landing support components (animations, layout, wl, stepper)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Port the redesigned landing component set

Replace the partial landing components in the target with the full redesigned set and add the new ones (`LandingClient` and its 15 section imports + 3D). Deliverable: the landing feature compiles and exports `LandingClient`.

**Files:**
- Create/replace: all files under `tasmil-finance/src/features/landing/components/` from the source `features/landing/components/` (incl. `3d/AbstractCube.tsx`)
- Replace: `tasmil-finance/src/features/landing/index.ts`

**Interfaces:**
- Consumes: support components from Task 2; `@/shared/ui/*`, `@/lib/utils`.
- Produces: default export `LandingClient` at `@/features/landing/components/LandingClient`; barrel re-export from `@/features/landing`.

- [ ] **Step 1: Copy the redesigned landing components (overwrite existing)**

```bash
cd /Users/nathan/Documents/morcalab/tasmil
SRC=tasmil-finance-new/src/features/landing/components
DST=tasmil-finance/src/features/landing/components
mkdir -p $DST/3d
cp $SRC/*.tsx $SRC/*.ts $DST/
cp $SRC/3d/*.tsx $DST/3d/
cp tasmil-finance-new/src/features/landing/index.ts tasmil-finance/src/features/landing/index.ts
```

- [ ] **Step 2: Rewrite imports in the landing components**

These components import each other with relative paths (`./Hero`, `./useLandingScripts`) — leave those unchanged. Rewrite only `@/`-prefixed imports per the mapping table in Task 2 Step 2. Sweep:
Run: `grep -rn "@/components/" tasmil-finance/src/features/landing || echo "none"`
Expected: `none`.

- [ ] **Step 3: Confirm the barrel exports `LandingClient`**

Open `tasmil-finance/src/features/landing/index.ts`; ensure it re-exports the client used by the route, e.g.:
```ts
export { default as LandingClient } from "./components/LandingClient";
```
If the source barrel exported the old `landing-page` composition, update it to export `LandingClient`.

- [ ] **Step 4: Format + type-check**

Run: `cd tasmil-finance && pnpm check:fix && pnpm type-check 2>&1 | grep -E "error" | grep -v "features/access\|features/waitlist" || echo "no unexpected errors"`
Expected: `no unexpected errors`.

- [ ] **Step 5: Commit**

```bash
cd tasmil-finance && git add -A && git commit -m "feat(landing): port full redesigned landing component set

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Mount the landing route with code-split 3D

Replace the "Launch App" stub with the real landing, scoped CSS via a route-group layout, and dynamically import the 3D-heavy client so `three`/`gsap` stay out of app/quest bundles. Deliverable: `/` renders the landing in `pnpm dev` and a Playwright smoke passes.

**Files:**
- Create: `tasmil-finance/src/app/(landing-page)/layout.tsx`
- Replace: `tasmil-finance/src/app/(landing-page)/page.tsx`
- Create: `tasmil-finance/e2e/landing.smoke.spec.ts`

**Interfaces:**
- Consumes: `LandingClient` from `@/features/landing`.

- [ ] **Step 1: Create the landing route-group layout**

Create `tasmil-finance/src/app/(landing-page)/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "@/features/landing/landing.css";

export const metadata: Metadata = {
  title: "Tasmil Finance — One Vault. Every Protocol.",
  description:
    "Autonomous DeFi yield optimization on Stellar. One vault, every protocol — deposit USDC or XLM and earn optimal yield automatically.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-page" data-grid="on" data-motion="on">{children}</div>;
}
```

- [ ] **Step 2: Replace the landing page stub with a code-split client**

Overwrite `tasmil-finance/src/app/(landing-page)/page.tsx`:
```tsx
"use client";

import dynamic from "next/dynamic";

const LandingClient = dynamic(
  () => import("@/features/landing/components/LandingClient"),
  { ssr: false },
);

export default function Home() {
  return <LandingClient />;
}
```
> `ssr: false` keeps the 3D/GSAP bundle off the server render and out of shared chunks. If `LandingClient` has no `default` export, adjust the dynamic import accordingly.

- [ ] **Step 3: Build and verify 3D is code-split**

Run: `cd tasmil-finance && pnpm build`
Expected: build exits 0. In the build output, the landing route's chunk is separate; `three` should not appear in the shared/app chunks.

- [ ] **Step 4: Write the landing smoke test**

Create `tasmil-finance/e2e/landing.smoke.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("landing page renders and exposes a launch entry point", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tasmil Finance/);
  // The landing nav/hero exposes a launch/app CTA.
  await expect(page.getByRole("link", { name: /launch|app|get started/i }).first()).toBeVisible();
});
```

- [ ] **Step 5: Run the smoke test**

Run: `cd tasmil-finance && pnpm exec playwright test e2e/landing.smoke.spec.ts`
Expected: 1 passed. If the CTA text differs, update the selector to match the real landing copy (verify by reading `Nav.tsx`/`Hero.tsx`), then re-run.

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance && git add -A && git commit -m "feat(landing): mount redesigned landing at / with code-split 3D + smoke test

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Port the waitlist feature + route

Bring over the multi-screen waitlist flow and wire it to the existing `/api/waitlist/*` routes and `gen-backend` hooks. Deliverable: `/waitlist` renders and the registration flow works against the backend.

**Files:**
- Create: `tasmil-finance/src/features/waitlist/components/{waitlist-phase-board,waitlist-screen1,waitlist-screen2,waitlist-screen3}.tsx`
- Create: `tasmil-finance/src/features/waitlist/hooks/use-wallet-waitlist.ts`
- Create: `tasmil-finance/src/features/waitlist/lib/{confetti-burst,share-to-x}.ts`
- Create: `tasmil-finance/src/features/waitlist/index.ts`
- Create: `tasmil-finance/src/app/(landing-page)/waitlist/page.tsx`

**Interfaces:**
- Consumes: `@/gen-backend/hooks/*`, `@/lib/kubb-backend-client` (or target equivalent), `@/shared/context/wallet-context`, `@/store/*`.
- Produces: `@/features/waitlist` barrel exporting the waitlist board/screens.

- [ ] **Step 1: Copy the waitlist feature**

```bash
cd /Users/nathan/Documents/morcalab/tasmil
cp -R tasmil-finance-new/src/features/waitlist tasmil-finance/src/features/waitlist
cp tasmil-finance-new/src/app/waitlist/page.tsx tasmil-finance/src/app/\(landing-page\)/waitlist/page.tsx
# also bring the client component if the route uses one:
[ -f tasmil-finance-new/src/app/waitlist/waitlist-page-client.tsx ] && cp tasmil-finance-new/src/app/waitlist/waitlist-page-client.tsx tasmil-finance/src/features/waitlist/components/waitlist-page-client.tsx || true
```

- [ ] **Step 2: Reconcile the backend client imports**

The waitlist hooks import `@/gen-backend/hooks/*` and `@/lib/kubb-backend-client`. Verify the needed hooks exist in the target's generated client:
Run: `ls tasmil-finance/src/gen-backend/hooks | grep -i waitlist`
- If the required waitlist hooks are present, point any `@/lib/kubb-backend-client` import at the target's client (`tasmil-finance/src/gen-backend/client` / existing `@/lib/*` client). Inspect `tasmil-finance/src/lib/` for the existing axios/kubb client and use it.
- If hooks are **missing**, regenerate (requires backend running on :6756):
  Run: `cd tasmil-finance && pnpm generate:backend`
  Then re-check. Do not hand-edit `gen-backend`.

- [ ] **Step 3: Rewrite remaining imports**

Apply the Task 2 mapping (`@/components/*` → `@/features/landing/components/*`). Sweep:
Run: `grep -rn "@/components/" tasmil-finance/src/features/waitlist || echo "none"`
Expected: `none`.

- [ ] **Step 4: Format, type-check, build**

Run: `cd tasmil-finance && pnpm check:fix && pnpm type-check && pnpm build`
Expected: all clean / exit 0.

- [ ] **Step 5: Smoke test the route**

Append to `tasmil-finance/e2e/landing.smoke.spec.ts`:
```ts
test("waitlist page renders", async ({ page }) => {
  await page.goto("/waitlist");
  await expect(page.getByRole("heading").first()).toBeVisible();
});
```
Run: `cd tasmil-finance && pnpm exec playwright test e2e/landing.smoke.spec.ts`
Expected: all passed.

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance && git add -A && git commit -m "feat(waitlist): port waitlist flow + route wired to backend

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Port the access-code gate + route

Bring over the wallet-connect + access-code redeem flow. Deliverable: `/access` renders, connects a wallet, and redeems a code via `/api/waitlist/redeem`.

**Files:**
- Create: `tasmil-finance/src/features/access/components/access-flow.tsx`
- Create: `tasmil-finance/src/features/access/hooks/use-access-code.ts`
- Create: `tasmil-finance/src/features/access/index.ts`
- Create: `tasmil-finance/src/app/(landing-page)/access/page.tsx`

**Interfaces:**
- Consumes: `@/shared/context/wallet-context` (`useWallet`), `@/shared/ui/{button,input}`, `@/features/landing/components/ui/stepper`, `@/features/landing/components/animations/svg-anims`, `/api/waitlist/redeem`.
- Produces: `@/features/access` barrel exporting `AccessFlow`.

- [ ] **Step 1: Copy the access feature + route**

```bash
cd /Users/nathan/Documents/morcalab/tasmil
cp -R tasmil-finance-new/src/features/access tasmil-finance/src/features/access
cp tasmil-finance-new/src/app/access/page.tsx tasmil-finance/src/app/\(landing-page\)/access/page.tsx
```

- [ ] **Step 2: Create the access barrel and rewrite imports**

Create `tasmil-finance/src/features/access/index.ts`:
```ts
export { AccessFlow } from "./components/access-flow";
export { useRedeemCode } from "./hooks/use-access-code";
```
In `access-flow.tsx`, rewrite the support imports per the Task 2 mapping:
- `@/components/ui/stepper` → `@/features/landing/components/ui/stepper`
- `@/components/animations/svg-anims` → `@/features/landing/components/animations/svg-anims`
- `@/shared/context/wallet-context`, `@/shared/ui/*` → unchanged.

In `access/page.tsx`, the source imports from `@/components/wl/{access,shared}`. Repoint to `@/features/landing/components/wl/{access,shared}`. Sweep:
Run: `grep -rn "@/components/" tasmil-finance/src/features/access tasmil-finance/src/app/\(landing-page\)/access || echo "none"`
Expected: `none`.

- [ ] **Step 3: Confirm the redeem endpoint path matches the target**

`use-access-code.ts` POSTs to `/api/waitlist/redeem`. Confirm the route exists:
Run: `ls tasmil-finance/src/app/api/waitlist/redeem/route.ts`
Expected: file exists (it does). No change needed.

- [ ] **Step 4: Format, type-check, build**

Run: `cd tasmil-finance && pnpm check:fix && pnpm type-check && pnpm build`
Expected: all clean / exit 0.

- [ ] **Step 5: Smoke test the route**

Append to `tasmil-finance/e2e/landing.smoke.spec.ts`:
```ts
test("access page renders the connect step", async ({ page }) => {
  await page.goto("/access");
  await expect(page.getByRole("button", { name: /connect/i }).first()).toBeVisible();
});
```
Run: `cd tasmil-finance && pnpm exec playwright test e2e/landing.smoke.spec.ts`
Expected: all passed. (Adjust the button selector to the real copy if needed.)

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance && git add -A && git commit -m "feat(access): port wallet-connect + access-code redeem flow + route

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Port the admin access-codes UI

Bring over the redesigned admin access-codes management UI + auth hooks, wired to the existing `/api/admin/codes/*` and `/api/admin-auth/*` routes. Deliverable: `/admin/login` and `/admin/access-codes` render and operate against the existing API routes.

**Files:**
- Create: `tasmil-finance/src/features/admin/hooks/{use-admin-auth,use-admin-codes}.ts`
- Create: `tasmil-finance/src/features/admin/index.ts`
- Create: `tasmil-finance/src/app/admin/access-codes/page.tsx`
- Create: `tasmil-finance/src/app/admin/login/page.tsx`
- Create (if the source admin group has one): `tasmil-finance/src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `@/store/use-admin-auth`, `@/gen-backend/*` or `/api/admin/*` + `/api/admin-auth/*`.
- Produces: `@/features/admin` barrel.

- [ ] **Step 1: Copy admin hooks + pages**

```bash
cd /Users/nathan/Documents/morcalab/tasmil
mkdir -p tasmil-finance/src/features/admin/hooks
cp tasmil-finance-new/src/features/admin/hooks/* tasmil-finance/src/features/admin/hooks/
cp -R tasmil-finance-new/src/app/admin/access-codes tasmil-finance/src/app/admin/access-codes
cp tasmil-finance-new/src/app/admin/login/page.tsx tasmil-finance/src/app/admin/login/page.tsx
# admin layout only if the target doesn't already have one:
[ -f tasmil-finance/src/app/admin/layout.tsx ] || cp tasmil-finance-new/src/app/admin/layout.tsx tasmil-finance/src/app/admin/layout.tsx
```
> NOTE: the target already has admin features (`admin`, `admin-auth`, `admin-topups`, `admin-whitelist`) and `/api/admin/codes/*` + `/api/admin-auth/login` routes. If a target admin page/route already covers access-codes, prefer wiring the redesigned UI to the existing route rather than duplicating. Inspect `tasmil-finance/src/features/admin` and `src/app/admin` first; resolve name clashes by keeping one implementation.

- [ ] **Step 2: Create barrel + rewrite imports**

Create `tasmil-finance/src/features/admin/index.ts` exporting the two hooks. Rewrite `@/components/*` and any `@/store/*` imports to resolve in the target. Verify the admin-auth API contract: source hooks call `/api/admin-auth/*` and `/api/admin/codes/*`.
Run: `ls tasmil-finance/src/app/api/admin/codes tasmil-finance/src/app/api/admin-auth`
Expected: `generate`, `route.ts`, `[id]` and `login` present. If the source UI also needs `/api/admin-auth/{challenge,logout,wallet-login}` and they are missing in the target, port those route files from `tasmil-finance-new/src/app/api/admin-auth/`.

- [ ] **Step 3: Format, type-check, build**

Run: `cd tasmil-finance && pnpm check:fix && pnpm type-check && pnpm build`
Expected: all clean / exit 0.

- [ ] **Step 4: Smoke test admin login renders**

Append to `tasmil-finance/e2e/landing.smoke.spec.ts`:
```ts
test("admin login page renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("button").first()).toBeVisible();
});
```
Run: `cd tasmil-finance && pnpm exec playwright test e2e/landing.smoke.spec.ts`
Expected: all passed.

- [ ] **Step 5: Commit**

```bash
cd tasmil-finance && git add -A && git commit -m "feat(admin): port redesigned access-codes admin UI wired to existing routes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Phase-1 verification gate + PR

Whole-phase verification and PR. Deliverable: green type-check, lint, build, and full landing smoke suite; PR opened against `deploy/prod`.

**Files:** none (verification only).

- [ ] **Step 1: Full quality gate**

Run:
```bash
cd tasmil-finance && pnpm check && pnpm type-check && pnpm test:ci && pnpm build
```
Expected: Biome check clean, `tsc` no errors, Jest passes, build exits 0. Fix anything that fails before continuing.

- [ ] **Step 2: Full landing smoke suite**

Run: `cd tasmil-finance && pnpm exec playwright test e2e/landing.smoke.spec.ts`
Expected: all tests passed (landing `/`, `/waitlist`, `/access`, `/admin/login`).

- [ ] **Step 3: Manual visual check (dev server)**

Run: `cd tasmil-finance && pnpm dev` and open `http://localhost:3000/`. Confirm: landing renders with 3D + correct fonts/colors; nav/footer present; `/waitlist` and `/access` flows visible; no console errors. Stop the dev server when done.

- [ ] **Step 4: Push branch and open PR**

```bash
cd tasmil-finance && git push -u origin feat/merge-landing-quest
gh pr create --repo Tasmil-Finance/tasmil-finance --base deploy/staging --head feat/merge-landing-quest \
  --title "feat: merge redesigned landing + access gate into app (Phase 1)" \
  --body "$(cat <<'EOF'
## Summary
Phase 1 of merging landing + quest into tasmil-finance: full redesigned landing at /, unified theme/font shell, waitlist + access-code gate, admin access-codes UI. Wired to existing backend API routes.

## Test plan
- pnpm check / type-check / test:ci / build all green
- Playwright e2e/landing.smoke.spec.ts: /, /waitlist, /access, /admin/login

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
> Do NOT merge here — hand the PR to the user. The PR targets `deploy/staging` (never `deploy/prod`). After any merge, check `gh run list --repo Tasmil-Finance/tasmil-finance --limit 3`.

---

## Self-Review

**Spec coverage (Phase 1 scope = "Landing + shell"):**
- Full redesigned landing port → Tasks 2, 3, 4 ✓
- Unified theme/provider/font/nav/footer → Task 1 (fonts, scoped CSS), root layout `AppProvider` reused, landing layout (Task 4) ✓
- Waitlist wired to existing routes → Task 5 ✓
- Access-code gate → Task 6 ✓
- Admin access-codes UI kept → Task 7 ✓
- 3D kept out of non-landing bundles → Task 4 Step 2/3 (dynamic import, build check) ✓
- Build exits 0 before deploy → Task 8 ✓

**Deferred to later phases (out of Phase-1 scope, per spec):** `gen-quest` client, native quest pages, social OAuth, domain cutover, iframe/CSP removal, repo archival.

**Placeholder scan:** No "TBD"/"handle edge cases" placeholders; selectors flagged as "adjust to real copy" are explicit verification steps, not gaps.

**Type/path consistency:** Import-rewrite mapping is identical across Tasks 2, 3, 5, 6 (`@/components/*` → `@/features/landing/components/*`); barrels export the exact symbols consumed by routes (`LandingClient`, `AccessFlow`, `useRedeemCode`).

**Known risk:** Step paths assume the source files import only the prefixes confirmed via grep. If a copied file references an unlisted `@/` path, the type-check step in that task will surface it; resolve by mapping to the target equivalent (all `shared/ui` primitives, `lib/utils`, `wallet-context` exist).
