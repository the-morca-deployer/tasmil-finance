# Landing Migration — Phase 4: StellarReel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert `StellarReel.tsx` (a static video + copy + stats section, no JS, no reveal) off `landing.css` onto Tailwind, keeping the look identical.

**Architecture:** Phase 4 of the section program. StellarReel is the simplest section — no state, no JS, no reveal hook. Pure CSS→Tailwind on one component.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md`. Keep look identical (qualitative visual gate).
- No `useLandingScripts.ts` change (this section has no JS). Remove `// @ts-nocheck` from `StellarReel.tsx`.
- Keep stable id `#backed` (nav/scroll-cue anchor) and the `.grad` class on the "Stellar." span (`.grad` is shared — Features/wl still use it; keep its CSS at landing.css:113).
- Remove StellarReel rules `landing.css` 258–334 (incl. dead `.sr-copy .eyebrow` at 302) after grep-guard. Do NOT remove `.grad`, `.reveal*`, `.btn*`, `.brand*`.
- Hard gates: `pnpm type-check` + `pnpm build` (biome disabled for landing — follow conventions manually).
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/StellarReel.tsx` | Rewrite (Tailwind), keep `#backed` + `.grad` |
| `src/features/landing/landing.css` | Remove `.stellar-reel`/`.sr-*` (258–334) guarded |

### Task 1: StellarReel → Tailwind
- [ ] **Step 1: Rewrite StellarReel.tsx.** Remove `// @ts-nocheck`; type it. Keep the `<section id="backed">`, the `<video>` (autoPlay/loop/muted/playsInline/preload="auto", `<source src="/tasmil-coins.webm">`), the `.sr-fade` overlay, the `<h2>` with `<span class="grad">Stellar.</span>` (keep `grad`), and the `.sr-meta` stats (3× value/label). Reproduce values from `landing.css`: `.stellar-reel`(258) `.sr-stage`(269) `.sr-vid`(274) `.sr-fade`(285) `.sr-copy`(295) `.sr-copy h2`(305) `.sr-copy p`(312) `.sr-meta`(319) `.sr-meta div`(326) `.sr-meta .v` `.sr-meta .l`. (`.sr-copy .eyebrow` at 302 is dead — no eyebrow in markup; ignore/remove.)
- [ ] **Step 2: Remove StellarReel CSS (guarded).**
  ```bash
  cd tasmil-finance
  for c in 'class="stellar-reel' sr-stage sr-vid sr-fade sr-copy sr-meta; do
    grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v StellarReel.tsx || echo "$c: clear"; done
  ```
  Delete `landing.css` 258–334. Re-grep: `.stellar-reel`/`.sr-vid` → 0; `.grad`/`.reveal`/`.btn-primary` retained (non-zero).
- [ ] **Step 3: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 4: Visual gate** — `pnpm dev`; capture a shot covering the `#backed` reel section vs baseline; confirm video stage, fade, "Backed by Stellar." gradient heading, and 3 stat columns match. Leave dev server as found.
- [ ] **Step 5: Commit** — `refactor(landing): convert StellarReel to Tailwind`.

### Task 2: Phase 4 gate
- [ ] `pnpm type-check && pnpm build` exit 0; StellarReel no `@ts-nocheck`; `#backed` present; `.grad` kept; `.sr-*` rules → 0. Append Phase 4 completion to ledger.

## Self-Review
- No-JS static section; only CSS→Tailwind. ✓
- `.grad` (shared) + `#backed` anchor kept; dead `.sr-copy .eyebrow` noted. ✓
- Shared CSS preserved; guard before removal. ✓
