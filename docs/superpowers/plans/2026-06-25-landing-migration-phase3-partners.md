# Landing Migration — Phase 3: Partners ticker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Convert the Partners ticker (`Partners.tsx`) off `landing.css` onto Tailwind, moving the JS-`innerHTML`-generated ticker items into JSX while keeping the scroll-scrub marquee (inline transform) intact and the look identical.

**Architecture:** Phase 3 of the section program. The ticker rows are currently built as HTML strings in `useLandingScripts.ts` and injected via `innerHTML`; this phase renders them in React/JSX with Tailwind instead, and the JS keeps only the scroll-scrub animation (which reads `#ticker`/`#ticker2` and sets `style.transform`).

**Convention note adopted from here on:** Converted sections KEEP the shared `class="reveal"` hook on reveal-on-scroll elements — the engine targets `.reveal` and the `.reveal*`/`.reveal.in` rules in `landing.css` stay (shared by 7 sections) until the final reveal-cleanup phase. This phase converts only Partners' own styling.

## Global Constraints

- Follow `docs/superpowers/landing-migration-conventions.md`.
- Keep look identical (qualitative visual gate). `data-*` only where this section has its own toggled state (Partners has none beyond reveal — keep `.reveal`).
- `useLandingScripts.ts` keeps `// @ts-nocheck`. Move the `protocols` data + `tkMark` + `innerHTML` writes OUT (into Partners.tsx); KEEP the scroll-scrub IIFE unchanged (it queries `#ticker`/`#ticker2`, `#partners`). Remove `// @ts-nocheck` only from `Partners.tsx`.
- Keep stable ids: `#partners`, `#ticker`, `#ticker2`.
- Do NOT remove shared CSS: `.reveal*`, `.btn*`, `.brand*`, and `.overline` (line 130) **if** other components still use it — grep-guard before removing.
- Remove dead `.tk-row*`/`.tk-logo*`/`.tk-meta*` (869–928) and Partners rules (1509–~1580) after guard.
- Hard gates: `pnpm type-check` + `pnpm build`. (Biome disabled for landing — follow conventions manually.)
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

---

## File Structure

| File | Action |
|---|---|
| `src/features/landing/components/Partners.tsx` | Rewrite: render ticker items in JSX (Tailwind), keep ids |
| `src/features/landing/components/useLandingScripts.ts` | Remove `protocols`/`tkMark`/`innerHTML` block; keep scroll-scrub IIFE. Keep `@ts-nocheck`. |
| `src/features/landing/landing.css` | Remove dead `.tk-row*` (869–928) + Partners rules (1509–~1580), guarded |

---

### Task 1: Partners → Tailwind, ticker items in JSX

**Files:** Rewrite `Partners.tsx`; modify `useLandingScripts.ts`; modify `landing.css`.

**Interfaces:**
- Produces: `#partners`, `#ticker`, `#ticker2` preserved with the duplicated ticker items rendered in the DOM (so the scroll-scrub IIFE's `scrollWidth`/`transform` math still works). Each ticker item reproduces the legacy `.tk-mark` (img + name, `.invert` for SDEX).

- [ ] **Step 1: Move the ticker data + item rendering into Partners.tsx**

In `useLandingScripts.ts`, DELETE the block that defines `protocols`, `tkMark`, `row2data`, and the two `tRow1.innerHTML = …` / `tRow2.innerHTML = …` assignments (the "partners ticker" section, ~lines 134–151). KEEP the scroll-scrub IIFE immediately after it (it references `tRow1`/`tRow2`; re-acquire them inside that IIFE via `document.getElementById("ticker")`/`("ticker2")` if the shared `const` is removed — adjust so the IIFE still has its row references). Keep `@ts-nocheck`.

In `Partners.tsx` (remove `// @ts-nocheck`, type it): define the `protocols` array (Blend, Soroswap, Aquarius, Phoenix, Allbridge, DeFindex, Templar, SDEX{inv}) and `row2data = [...protocols.slice(4), ...protocols.slice(0,4)]`. Render `#ticker` with `[...protocols, ...protocols]` and `#ticker2` (the `rev` row) with `[...row2data, ...row2data]`, each item a `.tk-mark`-equivalent (`<span>` with `<img>` + name `<span>`, `invert` styling for SDEX). Use the project's standard image element if other landing components use it; else `<img>`. Keep the `.overline reveal` heading element with its `reveal` class (shared entrance hook — do NOT remove `reveal`).

- [ ] **Step 2: Convert Partners styling to Tailwind**

Reproduce from `landing.css`: `.partners` (1509), `.partners-pin` (1514), `.partners .overline` (1523), `.ticker-mask` (1526) + `:hover` (1547), `.ticker` (1536), `.tk-mark` (1550) + `img` (1559) + `img.invert` (1566) + `span` (1569) + `:hover` (1575). The `rev` row (`.ticker.rev`) and the marquee transform stay JS-driven (inline). For the `.overline` text styling: if `.overline` (line 130) is used by other unconverted components, keep that class on the heading and leave its CSS; otherwise convert to utilities.

- [ ] **Step 3: Remove dead + converted CSS (guarded)**

```bash
cd tasmil-finance
for c in tk-row tk-logo tk-meta 'class="partners' partners-pin ticker-mask tk-mark; do
  grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Partners.tsx || echo "$c: clear";
done
grep -rln "overline" src/features/landing/components | grep -E '\.tsx$' | grep -v Partners.tsx | sed 's|.*/components/||' || echo "overline: Partners-only"
```
Delete dead `.tk-row*`/`.tk-logo*`/`.tk-meta*` (869–928) and the Partners block (1509–~1580). Keep `.overline` (130) if other components use it. Re-grep: `.partners`/`.tk-mark` → 0; `.reveal`/`.btn-primary` → non-zero.

- [ ] **Step 4: Hard gates** — `pnpm type-check && pnpm build` exit 0.

- [ ] **Step 5: Visual + behavior gate** — `pnpm dev`; capture `home-1440`, `home-1440-features` (Partners is above features; use a shot that includes it — or scroll-capture the partners region) vs baseline; confirm the two ticker rows render all 8 logos, scroll-scrub on scroll, idle drift, and `:hover` pause still work. Leave dev server as found.

- [ ] **Step 6: Commit** — `git commit -m "refactor(landing): convert Partners ticker to Tailwind, render items in JSX"`.

---

### Task 2: Phase 3 verification gate

- [ ] `pnpm type-check && pnpm build` exit 0.
- [ ] Invariants: `grep -c "@ts-nocheck" Partners.tsx` → 0; `useLandingScripts.ts` keeps it; ids `#partners`/`#ticker`/`#ticker2` present; `.partners`/`.tk-mark` rules → 0 in landing.css; `.reveal`/`.btn*` retained.
- [ ] Visual confirmation vs baseline (qualitative). Append Phase 3 completion to the ledger.

---

## Self-Review
- Ticker items moved JS→JSX, scroll-scrub JS retained → Task 1 Steps 1–2. ✓
- Dead `.tk-row*` + Partners CSS removed, `.overline` guarded, `.reveal` kept → Step 3. ✓
- Reveal-hook convention (keep `.reveal`) documented + applied. ✓
- ids preserved; `@ts-nocheck` discipline. ✓
- Risk: the scroll-scrub IIFE must keep valid `#ticker`/`#ticker2` references after the `innerHTML` block is removed — Step 1 calls this out explicitly.
