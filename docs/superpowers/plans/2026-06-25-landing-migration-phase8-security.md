# Landing Migration — Phase 8: Security — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert the Security section (`Security.tsx`, static — no JS, no state toggles) off `landing.css` onto Tailwind, keeping the look identical.

**Architecture:** Phase 8. Security is fully static: a sec-head, a two-column "ledger" (allow / deny — static modifier classes, not JS-toggled), and guard cards. No `useLandingScripts.ts` change. Pure CSS→Tailwind.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md` — token caveat (landing `:root` vars ≠ shadcn tokens; `font-mono` ≠ `--mono`; use `[var(--X)]`/`font-[var(--mono)]`).
- Keep look identical (qualitative visual gate).
- No `useLandingScripts.ts` change (Security has no JS; the `#steps`/`.step` JS targets no element and is dead/harmless). Remove `// @ts-nocheck` from `Security.tsx`.
- Keep stable id `#security` (nav anchor) and `class="reveal"` on the reveal elements (shared hook).
- The `.ledger-col.allow` / `.ledger-col.deny` are STATIC variant modifiers set in markup — reproduce both looks as Tailwind directly (no data-*). Keep inline `<svg stroke="var(--accent)">` etc. verbatim.
- Do NOT remove shared CSS: `.section`/`.wrap`/`.reveal*`/`.eyebrow`/`.sec-head`(+`.rt`)/`.grad`/`.btn*` (all shared — `.sec-head` is kept for Security + other sections). Remove Security-specific rules `landing.css` ~531–759 (`.security`/`.sec-ledger`(+::before)/`.ledger-seal`/`.ledger-col`(+allow/deny)/`.ledger-h`(+badge)/`.ledger-sub`/`.ledger-row`/`.ledger-ic`/`.sec-guards`/`.guard`(+hover)/`.guard-ic`/`.gt`/`.gl`) after grep-guard.
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`; build may be slow — wait). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/Security.tsx` | Rewrite (Tailwind), keep `#security` + `.reveal` + inline SVGs |
| `src/features/landing/landing.css` | Remove Security rules (~531–759) guarded |

### Task 1: Security → Tailwind
- [ ] **Step 1: Rewrite Security.tsx** (typed, no `@ts-nocheck`). Keep `<section id="security">`, `.sec-head reveal` (keep `sec-head`+`reveal` — `sec-head` styling stays in landing.css as shared; the `eyebrow`/`h2`/`rt` inside it stay shared-styled), the `.sec-ledger reveal`, both `.ledger-col` (allow + deny variants reproduced directly), `.ledger-h`/`.ledger-sub`/`.ledger-row`/`.ledger-ic`/`.ledger-seal`, and `.sec-guards`/`.guard`(+hover)/`.guard-ic`/`.gt`/`.gl`. Keep all inline `<svg>` markup verbatim. Reproduce values from `landing.css` (token+font caveats): `.security`(531)/`.sec-ledger`(539)+`::before`(551)/`.ledger-seal`(569)+svg(588)/`.ledger-col`(601)+`.allow`(605)+`.deny`(608)/`.ledger-h`(620)+`.badge`(631)/`.ledger-sub`(650)/`.ledger-row`(656)+adjacent(668)/`.ledger-ic`(679)+svg(697)/`.sec-guards`(704)/`.guard`(715)+`:hover`(727)/`.guard-ic`(730)+svg(741)/`.gt`(745)/`.gl`(751).
  - NOTE: `.sec-head` + its `.eyebrow`/`h2`/`.rt` children are SHARED rules (kept in landing.css). Leave those class names on the markup so the shared CSS styles them; do NOT convert sec-head internals to Tailwind in this phase (they convert when sec-head is finally removed). Only convert the Security-specific `.security`/`.sec-ledger`/`.ledger-*`/`.sec-guards`/`.guard*` parts.
- [ ] **Step 2: Remove Security CSS (guarded).**
  ```bash
  cd tasmil-finance
  for c in 'class="security' sec-ledger ledger-col ledger-h ledger-row ledger-ic ledger-seal sec-guards 'class="guard' guard-ic; do
    grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Security.tsx || echo "$c: clear"; done
  ```
  Delete the Security rules (~531–759, the `.security`/`.sec-ledger`/`.ledger-*`/`.sec-guards`/`.guard*`/`.gt`/`.gl` blocks). KEEP `.sec-head`(259–290)/`.eyebrow`/`.section`/`.reveal*`. Re-grep: `.sec-ledger`/`.guard\b` → 0; `.sec-head`/`.reveal`/`.btn-primary` retained.
- [ ] **Step 3: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 4: Visual gate** — capture a shot covering `#security` vs baseline; confirm the two-column ledger (allow/deny), the seal, guard cards + hover all match. Leave dev server as found.
- [ ] **Step 5: Commit** — `refactor(landing): convert Security to Tailwind`.

### Task 2: Phase 8 gate
- [ ] `type-check && build` exit 0; Security no `@ts-nocheck`; `#security` present; `.sec-ledger`/`.guard` rules → 0; shared `.sec-head`/`.eyebrow`/`.reveal` retained. Append Phase 8 completion to ledger.

## Self-Review
- Static section, no JS, no state. ✓
- `.sec-head` + internals kept shared (converted later); only Security-specific rules removed. ✓
- Inline SVGs kept verbatim; allow/deny static variants reproduced directly. ✓
- Token/font caveat applied. ✓
