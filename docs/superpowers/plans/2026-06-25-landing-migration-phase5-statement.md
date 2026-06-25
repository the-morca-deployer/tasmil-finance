# Landing Migration — Phase 5: Statement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert `Statement.tsx` (a pinned, scroll-scrubbed word-reveal headline) off `landing.css` onto Tailwind, driving the per-word `lit` state through `data-*`, keeping the look identical.

**Architecture:** Phase 5 of the section program. The headline words (`.rv-w`) light up progressively as the pinned section scrolls; `useLandingScripts.ts` computes how many words are lit from scroll progress and toggles `.lit`. This phase moves that to `dataset.lit` and styles via Tailwind data-variants. The `.reveal` wrapper keeps its shared hook.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md`. Keep look identical (qualitative visual gate).
- `data-*`: each `.rv-w` word gets `dataset.lit = "true"/"false"` → styled `data-[lit=true]:`.
- `useLandingScripts.ts` keeps `// @ts-nocheck`; change ONLY the statement word-reveal slice: `words.forEach((w,i) => w.classList.toggle("lit", i < lit))` → `w.dataset.lit = i < lit ? "true" : "false"`. Keep the scroll/resize listeners and the `#statement`/`h2.rv`/`.rv-w` queries. Remove `// @ts-nocheck` only from `Statement.tsx`.
- Keep stable JS hooks/ids: `#statement` (section), the `rv` class on the `<h2>` (JS `querySelector("h2.rv")`), and the `rv-w` class on each word span/em (JS `querySelectorAll(".rv-w")`). Keep `.reveal` on the `.wrap`.
- Remove Statement rules `landing.css` 295–~350 (`.statement-wrap`/`.statement-pin`/`.statement`/`.rule`/`h2`/`em`/`.rv-w`/`.rv-w.lit`/`.body`) after grep-guard. Do NOT remove `.reveal*`, `.btn*`, `.brand*`, `.wrap` (if shared — guard).
- Hard gates: `pnpm type-check` + `pnpm build` (biome disabled for landing — follow conventions manually). If `pnpm build` reports a `.next/lock`, wait for the lock to clear (a prior build may be finishing) then retry.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/Statement.tsx` | Rewrite (Tailwind), keep hooks, words get `data-lit="false"` initial + data-variant styling |
| `src/features/landing/components/useLandingScripts.ts` | Statement word-reveal slice: class→dataset. Keep `@ts-nocheck`. |
| `src/features/landing/landing.css` | Remove Statement rules (295–~350) guarded |

### Task 1: Statement → Tailwind + `data-lit`
- [ ] **Step 1: JS slice.** In the statement IIFE (~line 314), change `words.forEach((w, i) => w.classList.toggle("lit", i < lit));` to `words.forEach((w, i) => { w.dataset.lit = i < lit ? "true" : "false"; });`. Leave the scroll/resize listeners, `sec`/`#statement`/`h2.rv`/`.rv-w` queries unchanged. Keep `@ts-nocheck`.
- [ ] **Step 2: Rewrite Statement.tsx** (typed, no `@ts-nocheck`). Keep `<section id="statement">` + `.statement-pin` + `.wrap reveal` (keep `reveal`) + `.rule` + `<h2 class="rv">` (keep `rv`) with the 9 words each `<span class="rv-w">`/`<em class="rv-w">` (keep `rv-w`, add `data-lit="false"`) + `.body` paragraph. Reproduce values from `landing.css`: `.statement-wrap`(295) `.statement-pin`(299) `.statement`(309) `.rule`(312) `h2`(318) `h2 em`(327) `h2.rv .rv-w`(334, the dim base) `h2.rv .rv-w.lit`(338, the lit appearance → `data-[lit=true]:`) `.body`(346). Each word keeps `rv-w` (JS hook) + Tailwind base + `data-[lit=true]:<lit styles>`; `<em>` words add the emphasis styling.
- [ ] **Step 3: Remove Statement CSS (guarded).**
  ```bash
  cd tasmil-finance
  for c in statement-wrap statement-pin 'class="statement' 'rv-w' 'h2 class="rv'; do
    grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Statement.tsx || echo "$c: clear"; done
  grep -rln '"wrap"' src/features/landing/components | grep -E '\.tsx$' | grep -v Statement.tsx | sed 's|.*/||' || echo "wrap: check shared"
  ```
  Delete `landing.css` Statement rules 295–~350. Keep `.wrap` (line 105, likely shared — guard), `.reveal*`, `.btn*`. Re-grep: `.statement`/`.rv-w` → 0; `.reveal`/`.btn-primary` retained.
- [ ] **Step 4: Hard gates** — `pnpm type-check && pnpm build` exit 0 (retry on `.next/lock`).
- [ ] **Step 5: Visual + behavior gate** — `pnpm dev`; capture a shot covering `#statement` vs baseline; scroll through it and confirm words light up progressively (data-lit), rule + body match. Leave dev server as found.
- [ ] **Step 6: Commit** — `refactor(landing): convert Statement to Tailwind + data-lit word reveal`.

### Task 2: Phase 5 gate
- [ ] `pnpm type-check && pnpm build` exit 0; Statement no `@ts-nocheck`; `#statement`/`rv`/`rv-w` hooks present; `.statement`/`.rv-w` rules → 0; `.reveal`/`.wrap`(if shared) retained. Append Phase 5 completion to ledger.

## Self-Review
- Word-reveal state class→`data-lit`; JS hooks (`#statement`/`h2.rv`/`.rv-w`) + `.reveal` retained. ✓
- Shared `.wrap`/`.reveal*` guarded before removal. ✓
- JS slice given literally; component conversion specifies hooks + data contract + CSS line refs. ✓
- Risk: `.rv-w` appears 9× — ensure each word keeps `rv-w` (JS counts them) and the `data-[lit=true]:` styling; the behavior gate (scroll to watch progressive lighting) is the safety net.
