# Landing Migration — Phase 1: Shell + Reveal Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the always-on landing shell — Backdrop, Preloader, Nav, Sidebar drawer — and the cross-cutting scroll-reveal engine off `landing.css` onto Tailwind + shadcn, driving all state through `data-*` attributes, while keeping the look identical.

**Architecture:** Phase 1 of the section-by-section program (Approach A). The shell is done first because nav-scroll, the mobile drawer, and reveal-on-scroll are cross-cutting concerns every later section depends on. Each shell component becomes a typed, Tailwind-styled component; `useLandingScripts.ts` stops toggling legacy state classes and writes `data-*` instead; the reveal engine **dual-writes** (`data-inview` + legacy `.in`) so unconverted sections keep working until their own phase.

**Tech Stack:** Next.js 16, Tailwind v4 (`@theme`/`@utility` in `globals.css`), shadcn `Button` (`src/shared/ui/button.tsx`), `cn` from `@/lib/utils`, Biome.

## Global Constraints

- **Follow the playbook:** `docs/superpowers/landing-migration-conventions.md` governs every conversion (primitive mapping, override rule, token-first rule, `data-*` pairs, animation rule, per-section DoD). Read it first.
- **Keep look identical** — verify per component with the qualitative visual gate (see below). Pixel-AE is triage only; layout / typography / color / spacing / structure parity is the gate.
- **`data-*` contract (exact, from conventions §4):**
  - nav scroll: `nav.dataset.scrolled = "true" | "false"` → `data-[scrolled=true]:…`
  - drawer: `sidebar.dataset.state` / `scrim.dataset.state` / `burger.dataset.state` = `"open" | "closed"` → `data-[state=open]:…`
  - body scroll-lock: `document.body.dataset.sidebarOpen = "true" | "false"` → `data-[sidebar-open=true]:overflow-hidden`
  - preloader: `preload.dataset.done = "true"` → `data-[done=true]:…`
  - reveal: `el.dataset.inview = "true"` → `group-data-[inview=true]:…`
  - Always use explicit string values (`"true"`/`"false"`/`"open"`/`"closed"`), never bare attribute presence.
- **`useLandingScripts.ts` keeps `// @ts-nocheck`** this phase. It is one 817-line file covering all sections; only the shell slices change here. Do not remove `@ts-nocheck` until the final JS phase. Remove `// @ts-nocheck` only from the four component files (Nav/Sidebar/Backdrop/Preloader.tsx).
- **Keep stable `id` attributes** that `useLandingScripts.ts` selects by (`#nav`, `#prog`, `#navBurger`, `#sidebar`, `#navScrim`, `#sbClose`, `#preload`). Do not rename them.
- **Do NOT remove shared CSS** still used by unconverted components:
  - `.btn` / `.btn-primary` / `.btn-ghost` / `.btn-lg` (Hero, Cta, wl/*)
  - `.brand` / `.brand-name` / `.brand .mk` (Footer, wl/shared)
  - `.reveal` / `.reveal.in` / `.reveal.d1-d4` (Fees, Features, Security, Faq, Partners, Statement, Convergence)
  Only remove a CSS rule after grep-confirming no remaining `.tsx` uses its class.
- **Hard gates:** `pnpm type-check` and `pnpm build` must pass. **Lint gate is scoped** to changed files (repo has pre-existing lint debt in `loop-config/`, `src/app/(quest)/loading.tsx`, `src/shared/utils/date-group.ts` — out of scope).
- **Biome:** 2-space indent, width 100, double quotes, `import type`, no `any`, no `console.log`, `@/*` alias, import shadcn from the canonical path used elsewhere in the repo.
- **Branch** `feat/landing-tailwind-shadcn-migration`; do not push.
- **Capture/verify:** `node scripts/landing-visual-capture.mjs <outDir>` (settings locked in `docs/superpowers/landing-baseline-manifest.md`); baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/features/landing/components/Backdrop.tsx` | Ambient bg, stars, overlay, scroll-progress bar | Rewrite (Tailwind) |
| `src/features/landing/components/Preloader.tsx` | Boot splash | Rewrite (Tailwind, `data-done`) |
| `src/features/landing/components/Nav.tsx` | Top nav + burger | Rewrite (Tailwind + `Button`, `data-scrolled`) |
| `src/features/landing/components/Sidebar.tsx` | Mobile drawer + scrim | Rewrite (Tailwind + `Button`, `data-state`) |
| `src/features/landing/components/useLandingScripts.ts` | Imperative engine | Modify shell slices only (class→dataset); reveal dual-write. Keep `@ts-nocheck`. |
| `src/app/globals.css` | App-standard effects home | Modify (add `@utility`/`@theme` for bespoke shell effects if a utility can't express them inline) |
| `src/features/landing/landing.css` | Legacy stylesheet | Modify (remove only the converted, non-shared rules) |

**Visual gate (run at the end of each component task):** start `pnpm dev`, capture the listed shots into a temp dir with the capture script, and qualitatively compare each against the baseline of the same name — layout, typography, color, spacing, and structure must match; animated content differing in motion phase is expected.

---

### Task 1: Backdrop → Tailwind

**Files:**
- Rewrite: `src/features/landing/components/Backdrop.tsx`
- Modify: `src/features/landing/landing.css` (remove `.page-amb` 119, `.stars` 129, `.page-overlay` 146, `.prog` 492)
- Modify (only if needed): `src/app/globals.css` (`@utility` for the stars/ambient effect if it can't be expressed in inline utilities)

**Interfaces:**
- Consumes: nothing new.
- Produces: a Backdrop with the same DOM ids (`#prog` must remain — `useLandingScripts.ts` sets `prog.style.width`). No JS change in this task: the scroll-progress width is an inline style set by `onScroll`, which stays as-is. Only the element's *static* styling moves to Tailwind.

- [ ] **Step 1: Port the four backdrop layers to Tailwind**

Rewrite `Backdrop.tsx` removing `// @ts-nocheck`, typing it as a component returning JSX. Keep the four layer divs (`page-amb`, `stars`, `page-overlay`, `prog`) and the inline SVG `<filter id="tasmilCyan">` block **unchanged** (the SVG is not CSS — keep it verbatim). Replace each layer's styling by reading the legacy rules at `landing.css:119` (`.page-amb`), `:129` (`.stars`), `:146` (`.page-overlay`), `:492` (`.prog`) and expressing them as Tailwind utilities on the element. Per the conventions token-first rule, use tokens where they exist and arbitrary `[...]` values only where the original (radial gradients, fixed positions, blend modes) needs them. Keep `id="prog"` on the progress element.

For the stars field and ambient radial-gradient (complex, repeated background images), if inline utilities get unwieldy, add a named `@utility stars-field { … }` / `@utility page-ambient { … }` in `globals.css` (per conventions animation/effect rule) holding the verbatim background declarations, and apply that utility class on the element.

- [ ] **Step 2: Remove the converted rules from landing.css**

Confirm the four classes are used by no other component, then delete the rules:
```bash
cd tasmil-finance
for c in page-amb stars page-overlay 'prog"'; do grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Backdrop.tsx || echo "$c: unused elsewhere — safe"; done
```
Expected: each prints "safe". Then remove the `.page-amb`, `.stars`, `.page-overlay`, `.prog` blocks from `landing.css`.

- [ ] **Step 3: Build + lint (changed files)**

Run:
```bash
pnpm type-check && pnpm build && pnpm lint src/features/landing/components/Backdrop.tsx src/app/globals.css
```
Expected: type-check + build exit 0; lint reports no new errors in the changed files.

- [ ] **Step 4: Visual gate**

Start `pnpm dev`; `node scripts/landing-visual-capture.mjs <tmp>`; qualitatively compare `home-1440`, `home-1440-scrolled` (progress bar visible), `home-390` against baseline. Expected: ambient bg, star field, overlay, and progress bar look identical. Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/features/landing/components/Backdrop.tsx src/features/landing/landing.css src/app/globals.css
git commit -m "refactor(landing): convert Backdrop to Tailwind, drop legacy backdrop CSS"
```

---

### Task 2: Preloader → Tailwind + `data-done`

**Files:**
- Rewrite: `src/features/landing/components/Preloader.tsx`
- Modify: `src/features/landing/components/useLandingScripts.ts` (preloader slice, lines ~775–792)
- Modify: `src/features/landing/landing.css` (remove `.preload*` 3994–4060, **only after the StellarReel guard passes**)

**Interfaces:**
- Consumes: nothing.
- Produces: `#preload` element still present and still removed from the DOM by the JS after fade. State now `preload.dataset.done = "true"` instead of `classList.add("done")`.

- [ ] **Step 1: Guard the shared "preload" token**

`StellarReel.tsx` contains the substring "preload". Confirm whether it uses the `.preload` CSS class or something unrelated (e.g. an image-preload attribute):
```bash
cd tasmil-finance
grep -n "preload" src/features/landing/components/StellarReel.tsx
```
If it uses a *different* identifier (not the `.preload` / `.preload-*` classes), the `.preload*` rules are safe to remove. If it uses `.preload*`, STOP and report — those rules must stay. Record the finding.

- [ ] **Step 2: Port Preloader to Tailwind**

Rewrite `Preloader.tsx` removing `// @ts-nocheck`. Keep `id="preload"`. Reproduce the legacy look from `landing.css:3994` (`.preload`), `:4013` (`.preload-logo`), `:4024` (`.preload-name` + `b`/`i`), `:4044` (`.preload-bar` + `::after`). The fade-out (legacy `.preload.done`) becomes a Tailwind `data-[done=true]:` variant (e.g. `data-[done=true]:opacity-0 data-[done=true]:pointer-events-none` plus whatever the `.preload.done` rule at `:4008` does). The `.preload-bar::after` animation uses a keyframe already relocated to `globals.css` — reference it via `before:`/`after:` utilities or a small `@utility`.

- [ ] **Step 3: Switch the JS slice to `dataset`**

In `useLandingScripts.ts`, the preloader IIFE (~lines 775–792): change `pl.classList.add("done")` to `pl.dataset.done = "true"`. Leave `pl.remove()` and all timers unchanged. Do not remove `@ts-nocheck`.

- [ ] **Step 4: Remove `.preload*` rules (if guard passed)**

If Step 1 cleared it, delete the `.preload`, `.preload.done`, `.preload-logo`, `.preload-logo img`, `.preload-name`, `.preload-name b`, `.preload-name i`, `.preload-bar`, `.preload-bar::after` blocks from `landing.css`.

- [ ] **Step 5: Build + lint**

Run:
```bash
pnpm type-check && pnpm build && pnpm lint src/features/landing/components/Preloader.tsx
```
Expected: type-check + build exit 0; no new lint errors.

- [ ] **Step 6: Visual gate (preloader is short-lived)**

The preloader auto-hides ~450ms after load, so the baseline shots don't contain it. To verify, temporarily raise the hide delay in dev (or set `gone`-guard aside) to hold the splash visible, capture it, and compare against the legacy look (logo, wordmark `Tasmil Finance`, progress bar) — then revert the temporary delay. Confirm the fade-out still triggers (`data-done`) and the element is removed. Stop dev server.

- [ ] **Step 7: Commit**

```bash
git add src/features/landing/components/Preloader.tsx src/features/landing/components/useLandingScripts.ts src/features/landing/landing.css
git commit -m "refactor(landing): convert Preloader to Tailwind + data-done state"
```

---

### Task 3: Nav + Sidebar drawer → Tailwind + shadcn `Button` + `data-*`

**Files:**
- Rewrite: `src/features/landing/components/Nav.tsx`
- Rewrite: `src/features/landing/components/Sidebar.tsx`
- Modify: `src/features/landing/components/useLandingScripts.ts` (nav-scroll slice lines ~48–56; drawer slice lines ~743–773)
- Modify: `src/features/landing/landing.css` (remove `.nav*`, `.nav-center*`, `.nav-burger*`, `.nav-actions`, `.nav-scrim*`, `.sidebar*`, `.sidebar-head*`, `.sidebar-close*`, `.sb-nav`, `.sb-link*`, `.sb-cta*` — ranges 231–490; **keep `.brand*` and `.btn*`**)

**Interfaces:**
- Consumes: the `data-*` contract above; `Button` from shadcn; `APP_ENTRY` / `isWaitlistMode` from `@/lib/waitlist-mode` (already imported in Nav).
- Produces: `#nav`, `#navBurger`, `#sidebar`, `#navScrim`, `#sbClose` ids preserved for JS. Nav reads `data-[scrolled=true]:`; drawer elements read `data-[state=open]:`; `<body>` reads `data-[sidebar-open=true]:overflow-hidden`.

- [ ] **Step 1: Rewrite the nav-scroll + drawer JS slices to `dataset`**

In `useLandingScripts.ts`:

*Nav-scroll slice* (line 52) — change:
```ts
nav.classList.toggle("scrolled", scrollY > 16);
```
to:
```ts
nav.dataset.scrolled = scrollY > 16 ? "true" : "false";
```

*Drawer slice* (lines 750–766) — change the `open()` / `shut()` / toggle bodies from class toggles to dataset, and the body lock to `dataset.sidebarOpen`:
```ts
function open() {
  sb.dataset.state = "open";
  scrim.dataset.state = "open";
  burger.dataset.state = "open";
  burger.setAttribute("aria-expanded", "true");
  sb.setAttribute("aria-hidden", "false");
  document.body.dataset.sidebarOpen = "true";
}
function shut() {
  sb.dataset.state = "closed";
  scrim.dataset.state = "closed";
  burger.dataset.state = "closed";
  burger.setAttribute("aria-expanded", "false");
  sb.setAttribute("aria-hidden", "true");
  document.body.dataset.sidebarOpen = "false";
}
burger.addEventListener("click", () => (sb.dataset.state === "open" ? shut() : open()));
```
Keep `closeBtn`, `scrim`, link, and Escape listeners. Keep `@ts-nocheck`.

- [ ] **Step 2: Rewrite Nav.tsx (Tailwind + `Button`)**

Remove `// @ts-nocheck`; type it. Keep `id="nav"` on `<nav>` and `id="navBurger"` on the burger button, and the `<span>×3` burger bars. Convert:
- `.nav` base + `.nav.scrolled` (`landing.css:231`, `:248`) → utilities on `<nav>` incl. `data-[scrolled=true]:…` for the scrolled look.
- brand block → keep using the `.brand`/`.brand-name`/`.mk` classes **as-is** (those CSS rules stay — shared with Footer/wl). Replace `<img>` with the project's standard image element if other landing components do; otherwise keep `<img>`.
- `.nav-center` links (`:273`–`:296`) → utilities.
- `.nav-actions` buttons → shadcn `Button` per conventions: `Launch App` / `Join Waitlist` → `<Button asChild variant="gradient">`, `Have a code?` → `<Button asChild variant="ghost">` (or `outline` if that matches better), each wrapping the `<a href>`. Reproduce the legacy inline padding/fontSize (`padding:"11px 22px"`, `fontSize:"14px"`) via `className` overrides, not inline style. Keep the waitlist/non-waitlist branching and `APP_ENTRY` / `/waitlist` / `/access` targets.
- `.nav-burger` + `.nav-burger span` + `.nav-burger.open span:nth-child(n)` (`:299`, `:319`, `:329`–`:335`) → utilities; the open-state bar animation via `data-[state=open]:` on the burger (its bars are `nth-child`; use `[&>span:nth-child(1)]:` arbitrary variants combined with `data-[state=open]:`).

- [ ] **Step 3: Rewrite Sidebar.tsx (Tailwind + `Button`)**

Remove `// @ts-nocheck`; type it. Keep `id="navScrim"`, `id="sidebar"`, `id="sbClose"`, and `aria-hidden`. Convert:
- `.nav-scrim` + `.nav-scrim.open` (`:338`, `:351`) → utilities + `data-[state=open]:` (opacity/pointer-events).
- `.sidebar` + `.sidebar.open` (`:355`, `:373`) → utilities + `data-[state=open]:translate-x-0` (the slide-in).
- `.sidebar-head`, `.sidebar-head .brand` (keep `.brand`), `.sidebar-close`(+`:hover`) (`:377`–`:407`).
- `.sb-nav`, `.sb-link`(+`.sb-ar`, `:active`) (`:410`–`:442`).
- The staggered link reveal `.sidebar.open .sb-link:nth-child(n)` (`:445`–`:461`) → `data-[state=open]:` + per-child `[&:nth-child(n)]` delay utilities (or arbitrary `[transition-delay:Nms]`).
- `.sb-cta` (`:464`, `:474`) → shadcn `<Button asChild variant="gradient">` with `.btn-lg`-equivalent sizing via `size`/className; keep `href="/waitlist"`.

- [ ] **Step 4: Remove the converted nav/sidebar rules from landing.css**

Guard, then delete. Confirm none of the to-be-removed classes are used elsewhere (they are nav/sidebar-specific):
```bash
cd tasmil-finance
for c in 'class="nav' nav-center nav-burger nav-actions nav-scrim sidebar sb-nav sb-link sb-cta; do
  grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -vE '(Nav|Sidebar)\.tsx' || echo "$c: clear";
done
```
Expected: each prints "clear" (only Nav/Sidebar used them). Delete the `.nav*`/`.sidebar*`/`.sb-*`/`.nav-scrim*` blocks (ranges 231–490) **but keep `.brand*` (253–271) and `.btn*` (186–229)** — re-grep to confirm `.brand` and `.btn-primary` still appear in landing.css after the edit.

- [ ] **Step 5: Build + lint**

Run:
```bash
pnpm type-check && pnpm build && pnpm lint src/features/landing/components/Nav.tsx src/features/landing/components/Sidebar.tsx
```
Expected: type-check + build exit 0; no new lint errors.

- [ ] **Step 6: Visual + interaction gate**

Start `pnpm dev`; capture `home-1440` (nav at rest), `home-1440-scrolled` (nav scrolled look), `home-390-sidebar` (drawer open). Qualitatively compare against baseline — nav bar, links, CTA buttons, burger, scrim, drawer slide, and staggered links must match. Manually exercise: scroll toggles the scrolled look; burger opens drawer + locks body scroll; close button / scrim / link / Escape all shut it. Stop dev server.

- [ ] **Step 7: Commit**

```bash
git add src/features/landing/components/Nav.tsx src/features/landing/components/Sidebar.tsx src/features/landing/components/useLandingScripts.ts src/features/landing/landing.css
git commit -m "refactor(landing): convert Nav + Sidebar drawer to Tailwind/shadcn + data-* state"
```

---

### Task 4: Reveal engine → dual-write `data-inview`

**Files:**
- Modify: `src/features/landing/components/useLandingScripts.ts` (reveal registration, lines ~77–79)

**Interfaces:**
- Consumes: nothing.
- Produces: every `.reveal` element gains `data-inview="true"` when it scrolls into view, **in addition to** the legacy `.in` class. Unconverted sections keep animating via `.reveal.in` in `landing.css`; later section phases switch their styling to `group-data-[inview=true]:` and eventually the `.in` write is dropped (final phase). No look change this task.

- [ ] **Step 1: Dual-write in the reveal observer**

In `useLandingScripts.ts` (lines 77–79), change:
```ts
document
  .querySelectorAll(".reveal")
  .forEach((el) => onVisible(el, () => el.classList.add("in"), 0.06));
```
to also set the data attribute:
```ts
document
  .querySelectorAll(".reveal")
  .forEach((el) =>
    onVisible(
      el,
      () => {
        el.classList.add("in");
        el.dataset.inview = "true";
      },
      0.06
    )
  );
```
Keep `@ts-nocheck`. Do not touch `landing.css` `.reveal*` rules (still consumed by 7 sections).

- [ ] **Step 2: Build + lint + no-look-change check**

Run:
```bash
pnpm type-check && pnpm build && pnpm lint src/features/landing/components/useLandingScripts.ts
```
Expected: pass. Start `pnpm dev`; spot-check that reveal-on-scroll still animates (e.g. Features/Partners reveal as before) and that scrolled elements now carry `data-inview="true"` (inspect in devtools/`evaluate_script`). Look is unchanged. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/features/landing/components/useLandingScripts.ts
git commit -m "refactor(landing): dual-write data-inview on reveal engine (forward-compat)"
```

---

### Task 5: Phase 1 verification gate

**Files:** none (verification only).

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: a green, look-stable shell that Phase 2 (Hero) builds on.

- [ ] **Step 1: Hard gates + scoped lint**

Run:
```bash
cd tasmil-finance
pnpm type-check && pnpm build
pnpm lint src/features/landing/components/Backdrop.tsx src/features/landing/components/Preloader.tsx src/features/landing/components/Nav.tsx src/features/landing/components/Sidebar.tsx src/features/landing/components/useLandingScripts.ts
```
Expected: type-check + build exit 0; lint shows no NEW errors in the five changed files.

- [ ] **Step 2: Confirm shell invariants**

Run:
```bash
# four shell components no longer carry @ts-nocheck
grep -L "@ts-nocheck" src/features/landing/components/Backdrop.tsx src/features/landing/components/Preloader.tsx src/features/landing/components/Nav.tsx src/features/landing/components/Sidebar.tsx
# useLandingScripts still has it (intentional)
grep -l "@ts-nocheck" src/features/landing/components/useLandingScripts.ts
# stable ids intact
grep -c 'id="nav"\|id="prog"\|id="navBurger"\|id="sidebar"\|id="navScrim"\|id="sbClose"\|id="preload"' src/features/landing/components/*.tsx | grep -v ':0'
# shared CSS preserved
grep -c "\.brand\b\|\.btn-primary\|\.reveal\b" src/features/landing/landing.css
# landing.css shrank (shell rules gone)
grep -cE "\.nav\b|\.sidebar\b|\.preload\b|\.page-amb" src/features/landing/landing.css
```
Expected: all four component files listed by `grep -L` (no `@ts-nocheck`); `useLandingScripts.ts` listed by `grep -l`; ids present; shared classes still present (non-zero); shell selectors gone (0).

- [ ] **Step 3: Full qualitative visual confirmation**

Start `pnpm dev`; `node scripts/landing-visual-capture.mjs <scratchpad>/after-phase1`; qualitatively compare all 12 shots against baseline. The shell shots (`home-1440`, `home-1440-scrolled`, `home-390-sidebar`, `home-390`) must match in layout/type/color/spacing; JS-animated content may differ in motion phase (expected). Note any regression. Stop dev server.

- [ ] **Step 4: Record completion**

Append to the ledger `.superpowers/sdd/progress-landing-migration.md`: Phase 1 complete with the four shell commits + reveal dual-write, gates green, visual parity confirmed.

---

## Self-Review

**Spec/conventions coverage:**
- Conventions §4 `data-*` pairs → Tasks 2 (`data-done`), 3 (`data-scrolled`, `data-state`, `data-sidebar-open`), 4 (`data-inview`). ✓
- Spec §6 Phase 1 list (Nav, Sidebar, Backdrop, Preloader, progress, reveal/scroll engine) → Tasks 1–4 (progress bar is in Backdrop; reveal engine is Task 4). ✓
- Spec §3.2 animation rule (effects via globals `@utility`) → Task 1 Step 1, Task 2 Step 2. ✓
- Spec §4 verification (qualitative visual gate) → each task's visual gate + Task 5. ✓
- Spec §5 (shared CSS not removed prematurely) → Global Constraints + grep guards in Tasks 1/2/3. ✓

**Placeholder scan:** JS edits are given as literal before/after. Component conversions specify structure + `data-*` contract + primitive + exact CSS source line refs + visual gate (the precise utility strings are transcribed from the named legacy rules against the live look — guessing final class strings would be less accurate than reading the real CSS). No "TODO/TBD". ✓

**Type/name consistency:** `data-*` keys (`scrolled`, `state`, `sidebarOpen`, `done`, `inview`) and their Tailwind variants match the conventions doc verbatim. Ids (`#nav`, `#prog`, `#navBurger`, `#sidebar`, `#navScrim`, `#sbClose`, `#preload`) match the current markup and JS selectors. ✓

**Risk notes:** Task 3 is the largest (nav + drawer + burger animation + body lock); its interaction gate (Step 6) is the real safety net. The preloader visual gate (Task 2 Step 6) requires a temporary hide-delay change since the splash isn't in the baseline shots. StellarReel's "preload" token is grep-guarded before any `.preload*` removal (Task 2 Step 1).
