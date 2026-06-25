# Landing Migration — Phase 11: CTA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert the CTA section (`Cta.tsx`, a scroll-driven "pull-into-frame" banner) off `landing.css` onto Tailwind, keeping look + behavior identical.

**Architecture:** Phase 11. The CTA frame crops/insets as you scroll — driven by JS that sets CSS custom properties (`--crop-t/-r/-b/-l/--crop-radius/--frame-p`) on the frame element; the CSS consumes them via `clip-path: inset(...)`. NO state classes. So `useLandingScripts.ts` does NOT change; the converted `.cta-frame` element must keep consuming those JS-set vars via an arbitrary `clip-path` utility. Buttons → shadcn.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md` (token caveat: landing `:root` vars ≠ shadcn tokens; `font-mono` ≠ `--mono`; **gradient-via-var:** `[background:var(--grad)]` / `[background-image:var(--grad)]`, NEVER `bg-[var(--grad)]`).
- Keep look + behavior identical (qualitative visual + scroll to watch the frame crop in).
- **NO `useLandingScripts.ts` change** (the crop is driven by JS-set custom props — no state class). Remove `// @ts-nocheck` from `Cta.tsx` only.
- **Class-query hooks (preserve):** JS does `document.querySelector(".cta")` and `banner.querySelector(".cta-frame")` — the `.cta` and `.cta-frame` CLASSES must stay. Keep id `#start` (nav target). 
- The `.cta-frame` element must (a) declare initial `--crop-t/-r/-b/-l: 0px`, `--crop-radius: 0px`, `--frame-p: 0` so first paint is correct (inline `style` or `[--crop-t:0px]` arbitrary), and (b) consume them via `[clip-path:inset(var(--crop-t)_var(--crop-r)_var(--crop-b)_var(--crop-l)_round_var(--crop-radius))]`. The `.cta-frame::before` frame reads `top/right/bottom/left: var(--crop-*)` → reproduce via `before:[top:var(--crop-t)]` etc.
- Buttons `.btn.btn-primary.btn-lg` → `<Button asChild variant="gradient" size="lg">`, `.btn.btn-ghost.btn-lg` (with play-icon svg) → `<Button asChild variant="ghost" size="lg">`; reproduce the `.hub-cta .btn-primary`/`.btn-ghost svg` scoped tweaks (756–760) via className. Keep waitlist/`#features` targets + the `→` arrow + play svg.
- Do NOT remove shared CSS: `.btn*`/`.section`/`.reveal*`. Remove CTA rules `landing.css` ~533–762 (`.cta`/`.cta-sticky`(+::before)/`.hub-card`(+`.cta-frame`,+::before)/`.hub-bg`/`.hub-veil`/`.hub-inner`/`.hub-card h2`/`.hsub`/`.hub-cta`). The `.hub-lines`/`.hub-star`/`.hub-badge` rules are DEAD (no markup) — guard+remove.
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`; may be slow — wait). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/Cta.tsx` | Rewrite (Tailwind + shadcn Button), keep `#start`/`.cta`/`.cta-frame` + JS-var clip-path |
| `src/features/landing/landing.css` | Remove CTA rules (~533–762) guarded; dead `.hub-lines`/`.hub-star`/`.hub-badge` removed |

### Task 1: CTA → Tailwind (crop JS unchanged)
- [ ] **Step 1: Rewrite Cta.tsx** (typed, no `@ts-nocheck`). Keep `<section class="cta" id="start">` (KEEP `cta` class), `.cta-sticky` (+the `::before` ambient), `.hub-card cta-frame` (KEEP `cta-frame` class; declare initial `--crop-*`/`--frame-p` + the `[clip-path:inset(...)]`), `.hub-bg` (horizon img), `.hub-veil`, `.hub-inner` → `<h2>` + `.hsub` + `.hub-cta` (two `<Button>`). Reproduce values from `landing.css`: `.cta`(533)/`.cta-sticky`(538)+::before(544)/`.hub-card.cta-frame`(555)+::before(570)/`.hub-card`(595)/`.hub-bg`(613)/`.hub-veil`(622)/`.hub-inner`(711)/`h2`(736)/`.hsub`(743)/`.hub-cta`(750)+button tweaks(756–760). Token/font/gradient caveats. Keep inline `<svg>` (play icon) verbatim.
- [ ] **Step 2: Remove CTA CSS (guarded).**
  ```bash
  cd tasmil-finance
  for c in 'class="cta"' cta-sticky 'hub-card' cta-frame hub-bg hub-veil hub-inner hub-cta hsub; do
    grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Cta.tsx || echo "$c: clear"; done
  ```
  Delete CTA rules (~533–762) incl. dead `.hub-lines`/`.hub-star`/`.hub-badge`. Keep `.btn*`/`.section`/`.reveal*`. Re-grep: `.cta\b`/`.cta-frame`/`.hub-card` → 0; `.btn-primary` retained.
- [ ] **Step 3: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 4: Visual + behavior gate** — capture a shot covering `#start` vs baseline; SCROLL through the CTA and confirm the frame crops inward (clip-path inset animates with the JS-set `--crop-*` vars), the horizon bg + veil + heading + 2 buttons render. Confirm `.cta`/`.cta-frame` found by JS (the crop animates). Leave dev server as found.
- [ ] **Step 5: Commit** — `refactor(landing): convert CTA to Tailwind (crop JS unchanged)`.

### Task 2: Phase 11 gate
- [ ] `type-check && build` exit 0; CTA no `@ts-nocheck`; `useLandingScripts.ts` untouched; `#start` + `.cta`/`.cta-frame` classes present; `.cta`/`.hub-card` rules → 0; shared `.btn*` retained. Append Phase 11 completion to ledger.

## Self-Review
- Scroll-crop is JS-var-driven (no state class) → NO JS change; `.cta`/`.cta-frame` class hooks + `#start` preserved; `[clip-path:inset(var(--crop-*)…)]` consumes the JS-set vars + initial defaults declared. ✓
- Buttons → shadcn with scoped tweaks; dead `.hub-lines`/`.hub-star`/`.hub-badge` removed. ✓
- Token/font/gradient caveat; inline play SVG verbatim. ✓
- Risk: if the `--crop-*` initial defaults or the clip-path arbitrary syntax are wrong, the frame won't crop — the behavior gate (scroll to watch) is the safety net.
