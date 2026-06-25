# Landing Migration — Phase 12: Footer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert the Footer (`Footer.tsx`) off `landing.css` onto Tailwind, converting the skyline-aurora reveal state class to `data-*`, keeping look + behavior identical.

**Architecture:** Phase 12. The footer has a brand/links grid, a skyline "aurora" that rises when scrolled into view (`.fa-cols.in` via an IntersectionObserver on `.fa-mark`), social icons, copy, and the ghost wordmark `.fa-mark`. Convert the one state class to `data-*`; keep the JS hooks.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md` (token caveat; `font-mono` ≠ `--mono`; GRADIENT-via-var: `[background:var(--grad)]`/`[background-image:var(--grad)]`, NEVER `bg-[var(--grad)]`).
- Keep look + behavior identical (qualitative visual + scroll to bottom to watch the aurora rise).
- `useLandingScripts.ts` keeps `// @ts-nocheck`; convert ONLY the footer-aurora slice: `faCols.classList.toggle("in", es[0].isIntersecting)` (line ~123) → `faCols.dataset.in = es[0].isIntersecting ? "true" : "false"`. Keep the IntersectionObserver + `.fa-mark` observe. **Leave the DEAD `.foot-ghost`/`.foot-contract` JS (~602–620) untouched** (it queries elements not in the markup — null-guarded, harmless; the final JS-cleanup phase removes it). Remove `// @ts-nocheck` from `Footer.tsx` only.
- **Class-query hooks (preserve):** JS does `document.querySelector(".fa-cols")` and `document.querySelector(".fa-mark")` — the `.fa-cols` and `.fa-mark` CLASSES must stay (the observer watches `.fa-mark` and toggles state on `.fa-cols`). The `.fa-cols` is the `group` carrying `data-in`.
- Do NOT remove shared CSS: keep the GLOBAL `.brand`(176)/`.brand-name`(184)/`.brand .mk`(191) — still used by Footer + wl/ (Phase 13). Keep `.section`/`.reveal*`/`.btn*`. The Footer keeps `class="brand"` on its brand link (styled by the shared global `.brand`); reproduce the scoped `.foot-brand .brand`(565)/`.foot-brand .mk`(570) tweaks inline.
- Remove Footer rules `landing.css`: LIVE — `.footer`(534)+::before(541)/`.foot-grid`(551)/`.foot-brand`(558)/`.foot-desc`(574)/`.foot-col`(579)+`.foot-head`(584)+`a`(592)+hover(599)/`.foot-aurora`(717)/`.fa-cols`(725)+`.fa-col`(730)+::before(734)+`.in`(755)+nth-child(758–779)/`.fa-grain`(788)/`.fa-top`(797)/`.fa-social`(805)/`.fa-ic`(809)+hover/svg/`.fa-copy`(831)+`.fa-disc`(837)/`.fa-mark`(844)+b(861). DEAD (not in markup — guard+remove too) — `.foot-contract`(602)/`.cdot`(616)/`.foot-bottom`(623)/`.foot-legal`(634)/`.copy`(643)/`.foot-x`(646)/`.foot-ghost`(665)+::after(690). Keep the GLOBAL `.brand*`.
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`; may be slow — wait). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/Footer.tsx` | Rewrite (Tailwind), `.fa-cols` group + `data-in`; keep `.fa-cols`/`.fa-mark`/`.brand` classes |
| `src/features/landing/components/useLandingScripts.ts` | Footer-aurora slice: `.in` class → dataset. Keep `@ts-nocheck`. |
| `src/features/landing/landing.css` | Remove live + dead Footer rules; keep GLOBAL `.brand*` |

### Task 1: Footer → Tailwind + data-in
- [ ] **Step 1: Footer-aurora JS slice** (~line 123): `faCols.classList.toggle("in", es[0].isIntersecting)` → `faCols.dataset.in = es[0].isIntersecting ? "true" : "false"`. Keep the observer + `.fa-mark` observe + threshold. Do NOT touch the dead `.foot-ghost`/`.foot-contract` JS. Keep `@ts-nocheck`.
- [ ] **Step 2: Rewrite Footer.tsx** (typed, no `@ts-nocheck`). Keep `<footer>`, `.foot-grid` (brand + 3 link cols), the brand `<a class="brand">`(KEEP `brand`/`mk`/`brand-name` classes — shared global styles them; reproduce `.foot-brand .brand`/`.mk` scoped tweaks inline), `.foot-desc`, `.foot-col`+`.foot-head`+links, `.foot-aurora` → `.fa-cols`(KEEP class; `group` + `data-in="false"`; 7 `.fa-col` with `style={{"--h":…}}` + per-`:nth-child` `::before` rise) + `.fa-grain`, `.fa-top`→`.fa-social`(3 `.fa-ic` social svgs)+`.fa-copy`(+`.fa-disc`), and the `.fa-mark`(KEEP class) wordmark. Reproduce values from the live `landing.css` ranges above (token/font/gradient caveats). The `.fa-cols.in .fa-col::before`(755) rise → `group-data-[in=true]:` on the cols driving the bars' `::before` (via `before:` + the per-child nth + the `--h` height). Keep inline social `<svg>` verbatim.
- [ ] **Step 3: Remove Footer CSS (guarded).**
  ```bash
  cd tasmil-finance
  for c in 'class="footer' foot-grid foot-brand foot-desc foot-col foot-head foot-aurora fa-cols fa-col fa-grain fa-top fa-social fa-ic fa-copy fa-mark; do
    grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Footer.tsx || echo "$c: clear"; done
  ```
  Remove the live Footer rules AND the dead `.foot-contract`/`.cdot`/`.foot-bottom`/`.foot-legal`/`.copy`/`.foot-x`/`.foot-ghost` rules. KEEP the GLOBAL `.brand`(176)/`.brand-name`/`.brand .mk` (still used by wl). Re-grep: `.footer`/`.fa-cols`/`.fa-mark` rules → 0; GLOBAL `.brand\b` retained; `.btn-primary`/`.reveal` retained.
- [ ] **Step 4: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 5: Visual + behavior gate** — capture a shot covering the footer vs baseline; SCROLL to the bottom and confirm the aurora skyline bars RISE when `.fa-mark` enters view (`data-in`), the brand/links grid, social icons, copy, and ghost wordmark all match. Confirm `.fa-cols`/`.fa-mark` found by JS (aurora animates). Leave dev server as found.
- [ ] **Step 6: Commit** — `refactor(landing): convert Footer to Tailwind + data-in aurora`.

### Task 2: Phase 12 gate
- [ ] `type-check && build` exit 0; Footer no `@ts-nocheck`; `useLandingScripts.ts` keeps it; `.fa-cols`/`.fa-mark`/`.brand` classes present; `.footer`/`.fa-cols` rules → 0; GLOBAL `.brand*`/`.btn*`/`.reveal*` retained. Append Phase 12 completion to ledger.

## Self-Review
- Aurora reveal `.fa-cols.in` → `data-in`; class hooks `.fa-cols`/`.fa-mark` + GLOBAL `.brand` preserved; dead `.foot-ghost`/`.foot-contract` JS left for Phase 14. ✓
- Live + dead Footer CSS removed; GLOBAL `.brand*` kept (wl still uses it). ✓
- Token/font/gradient caveat; inline social SVGs verbatim; per-`:nth-child` aurora bar stagger reproduced. ✓
- Risk: the aurora bars' per-child `::before` rise + `--h` heights + `data-in` gate — the behavior gate (scroll to watch the rise) is the safety net.
