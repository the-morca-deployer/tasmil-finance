# Landing Migration — Phase 2: Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Convert the landing Hero (`Hero.tsx`) off `landing.css` onto Tailwind + shadcn, driving its `lit` / entrance / `done` states through `data-*`, keeping the look identical.

**Architecture:** Phase 2 of the section-by-section program. Hero owns its own entrance window via a hero-local `data-done` state instead of depending on the cross-cutting page-level `.landing-page.anim` gate (which stays class-based for the 7 unconverted reveal sections). The pointer parallax stays as a JS-set inline transform.

**Tech Stack:** Next.js 16, Tailwind v4 (`@theme`/`@utility` in `globals.css`), shadcn `Button` + `Badge`, `cn` from `@/lib/utils`.

## Global Constraints

- **Follow** `docs/superpowers/landing-migration-conventions.md` (primitive mapping, override rule, token-first, `data-*`, animation rule).
- **Keep look identical** — qualitative visual gate (layout/typography/color/spacing/structure); motion-phase differences expected.
- **`data-*` contract (hero-local):** the hero element (`<header class="hero" id="top">`) carries `data-lit` and `data-done`:
  - `hero.dataset.lit = "true"` (skyline bars rise) → skyline `::before` styled via `data-[lit=true]:` (group/ancestor).
  - `hero.dataset.done = "true"` (entrance retired, set at 2600ms) → entrance animations apply only while NOT done: `motion-safe:group-data-[done=false]:animate-rise` etc.
  - Hero starts rendered with `data-done="false"` and `data-lit="false"`.
- **`useLandingScripts.ts` keeps `// @ts-nocheck`** — change only the two hero slices (skyline-lit line ~82, hero-done line ~119). Keep the parallax IIFE (it sets `obj.style.transform` — leave as inline style). Remove `// @ts-nocheck` only from `Hero.tsx`.
- **Keep stable ids:** `#top` (hero), `#heroStage`, `#obj3d`.
- **Do NOT remove shared CSS:** keep `.btn*` (Cta/wl), `.brand*`, `.reveal*`, and the page-level `.landing-page.anim .reveal` rules. Do NOT touch the `.landing-page.anim` mechanism. Only remove Hero-specific rules (`landing.css` 268–614) after grep-guarding.
- **Hard gates:** `pnpm type-check` + `pnpm build`. (Biome lint is disabled for `src/features/landing/**` — follow conventions manually: no `any`, `import type`, double quotes, no `console.log`.)
- **Branch** `feat/landing-tailwind-shadcn-migration`; no push. **Capture:** `node scripts/landing-visual-capture.mjs <out>`; baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/features/landing/components/Hero.tsx` | Hero section markup | Rewrite (Tailwind + Button + Badge, `data-lit`/`data-done`) |
| `src/features/landing/components/useLandingScripts.ts` | Engine | Modify two hero slices only (class→dataset). Keep `@ts-nocheck`. |
| `src/app/globals.css` | Effects home | Modify if a keyframe needs an `@theme --animate-*` token (`heroFloaty3d`, `rise`, `cue`) or an effect needs `@utility` |
| `src/features/landing/landing.css` | Legacy | Remove Hero rules 268–614 (incl. dead `.hero-orbits`/`.labels`/`.lab*`) after guard |

---

### Task 1: Hero → Tailwind + shadcn + `data-*`

**Files:**
- Rewrite: `src/features/landing/components/Hero.tsx`
- Modify: `src/features/landing/components/useLandingScripts.ts` (hero skyline-lit ~line 82; hero-done ~line 119)
- Modify: `src/app/globals.css` (animate tokens / utilities as needed)
- Modify: `src/features/landing/landing.css` (remove 268–614 Hero rules, guarded)

**Interfaces:**
- Consumes: `Button` (variants `gradient`/`ghost`, size `lg`), `Badge`, `APP_ENTRY`/`isWaitlistMode` from `@/lib/waitlist-mode`.
- Produces: hero element keeps `id="top"` + carries `data-lit`/`data-done`; `#heroStage` + `#obj3d` preserved for the parallax IIFE.

- [ ] **Step 1: Convert the two hero JS slices to `dataset`**

In `useLandingScripts.ts`:
- Skyline lit (~line 82): change
  ```ts
  setTimeout(() => document.querySelector(".hero")?.classList.add("lit"), 200)
  ```
  to set the data attribute (target the same hero element):
  ```ts
  setTimeout(() => {
    const h = document.getElementById("top");
    if (h) h.dataset.lit = "true";
  }, 200)
  ```
- Hero done (~line 119): change
  ```ts
  setTimeout(() => hero.classList.add("done"), 2600);
  ```
  to:
  ```ts
  setTimeout(() => { if (hero) hero.dataset.done = "true"; }, 2600);
  ```
  (`hero` is already `document.getElementById("top")`.)
- Leave the parallax IIFE (`#heroStage`/`#obj3d`, `obj.style.transform`) unchanged. Keep `@ts-nocheck`.

- [ ] **Step 2: Rewrite Hero.tsx**

Remove `// @ts-nocheck`; type it. Keep `id="top"` on `<header>` and render it as a `group` with `data-lit="false" data-done="false"`. Keep `id="heroStage"` and `id="obj3d"`. Reproduce the look from `landing.css`:
- `.hero` (268), `.hero-floor` (277), `.hero-fade` (334) → utilities.
- `.hero-skyline` (294) + `.hs-col` (308) + `.hs-col::before` (312) + lit state `.hero.lit .hs-col::before` (344) → utilities; the lit rise via `data-[lit=true]:` (use ancestor/group: the hero is the `group`, so `group-data-[lit=true]:` on the bars' `::before` via `before:` utilities, or a small `@utility`). The `--h` per-column custom property (set inline via `style={{ "--h": … }}`) stays.
- `.hero-pill` (392) → `<Badge>` + className override to match.
- `.hero h1` (406) + `.l1` (413) + `.l2` (416), `.hero .sub` (423) → utilities.
- `.hero-cta` (430) + the two buttons (`btn btn-primary btn-lg` → `<Button asChild variant="gradient" size="lg">`; `btn btn-ghost btn-lg` → `<Button asChild variant="ghost" size="lg">`) wrapping the `<a>` links; keep waitlist branching + `APP_ENTRY`/`#features` targets + the `→` arrow.
- `.hero-object` (436) + `::before` glow (443) + `.obj3d` (458) + `.obj3d img` (465) → utilities; the `heroFloaty3d` float keyframe (already in globals.css) applied via `animate-[heroFloaty3d_…]` or an `@theme --animate-hero-floaty-3d` token. Keep the `<img src="/tasmil-crypto.svg">`.
- `.scroll-cue` (570) + `.dot` (585) → utilities; the `cue` keyframe via animate utility.
- **Entrance choreography** (`landing.css` 593–615, inside `@media (prefers-reduced-motion: no-preference)`): each of hero-pill / `h1 .l1` / `h1 .l2` / `.sub` / `.hero-cta` / `.hero-object` / `.scroll-cue` plays the `rise` keyframe at staggered delays (0, .08s, .18s, .3s, .4s/.3s, .7s) while the hero is NOT done. Express as `motion-safe:group-data-[done=false]:animate-[rise_…]` with per-element `[animation-delay:Nms]` (or an `@theme --animate-rise` token + delay utilities). This replaces the `.landing-page.anim .hero:not(.done)` gate with the hero-local `group-data-[done=false]` gate.

- [ ] **Step 3: Remove Hero rules from landing.css (guarded)**

Confirm hero classes are used by no other component, then delete `landing.css` lines 268–614 (the whole Hero block incl. dead `.hero-orbits`, `.hero-object .labels`, `.hero-object .lab*` which are not in the markup):
```bash
cd tasmil-finance
for c in 'class="hero' hero-floor hero-skyline hs-col hero-pill hero-cta hero-object obj3d scroll-cue hero-orbits; do
  grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Hero.tsx || echo "$c: clear";
done
```
Expected: each "clear". Delete the Hero block. Then re-grep to confirm shared rules remain: `grep -c "\.btn-primary\|\.brand\b\|\.reveal\b\|anim .reveal" landing.css` (non-zero) and `grep -c "\.hero\b" landing.css` (0).

- [ ] **Step 4: Hard gates**

```bash
pnpm type-check && pnpm build
```
Expected: both exit 0.

- [ ] **Step 5: Visual + interaction gate**

`pnpm dev` (reuse :3000 if up); `node scripts/landing-visual-capture.mjs <tmp>`; compare `home-1440`, `home-768`, `home-390` against baseline — hero headline, pill, sub, CTAs, 3D object + glow, skyline, scroll cue must match in layout/type/color. Manually: reload and confirm the entrance animation plays once then settles (data-done at 2600ms); pointer over the 3D object tilts it; skyline bars rise (data-lit). Reduced-motion: entrance suppressed. Leave dev server as found.

- [ ] **Step 6: Commit**

```bash
git add src/features/landing/components/Hero.tsx src/features/landing/components/useLandingScripts.ts src/app/globals.css src/features/landing/landing.css
git commit -m "refactor(landing): convert Hero to Tailwind/shadcn + data-lit/data-done"
```

---

### Task 2: Phase 2 verification gate

**Files:** none (verification only).

- [ ] **Step 1: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 2: Invariants** —
  ```bash
  grep -L "@ts-nocheck" src/features/landing/components/Hero.tsx        # listed (no nocheck)
  grep -l "@ts-nocheck" src/features/landing/components/useLandingScripts.ts  # still has it
  grep -c 'id="top"\|id="heroStage"\|id="obj3d"' src/features/landing/components/Hero.tsx  # ids present
  grep -cE "\.hero\b" src/features/landing/landing.css                  # 0 (hero rules gone)
  grep -cE "\.btn-primary|\.brand\b|anim .reveal" src/features/landing/landing.css  # non-zero (shared kept)
  ```
- [ ] **Step 3: Visual confirmation** — `node scripts/landing-visual-capture.mjs <scratchpad>/after-phase2`; compare `home-1440`/`home-768`/`home-390` vs baseline (qualitative). Note any regression.
- [ ] **Step 4: Record** — append Phase 2 completion to `.superpowers/sdd/progress-landing-migration.md`.

---

## Self-Review

- Conventions §4 `data-*` → `data-lit`/`data-done` hero-local (Task 1 Steps 1–2). ✓
- Spec §6 Phase 2 (Hero) → Task 1. ✓
- Entrance choreography decoupled from page `.anim` gate (kept for reveal sections) — explicit in Step 2. ✓
- Animation rule (keyframes via globals `@theme`/utility) → Step 2 (`heroFloaty3d`, `rise`, `cue`). ✓
- Shared CSS preserved + dead Hero CSS removed → Step 3 guard. ✓
- JS slices given literally; component conversion specifies structure + data contract + primitives + exact CSS line refs + visual gate (utility strings transcribed from the named legacy rules — not guessed). No placeholders. ✓
- Risk: the entrance `group-data-[done=false]` + `motion-safe` combination is the trickiest part; the interaction gate (Step 5: reload to watch entrance) is the safety net.
