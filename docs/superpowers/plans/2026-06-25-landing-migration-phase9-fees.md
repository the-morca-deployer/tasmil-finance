# Landing Migration — Phase 9: Fees — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert the Fees section (`Fees.tsx`, with an inline-style word rotator) off `landing.css` onto Tailwind, keeping look + behavior identical.

**Architecture:** Phase 9. Fees has a "No deposit/withdrawal/subscription fee." word rotator driven entirely by inline `style.transform`/`style.width` in `useLandingScripts.ts` — NO state classes. So `useLandingScripts.ts` does NOT change; just preserve the JS hooks. Everything else is static CSS→Tailwind.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md` (token caveat: landing `:root` vars ≠ shadcn tokens; `font-mono` ≠ `--mono`; use `[var(--X)]`/`font-[var(--mono)]`).
- Keep look + behavior identical (qualitative visual + watch the rotator cycle).
- **NO `useLandingScripts.ts` change** (the rotator uses only inline styles — no state class to convert). Remove `// @ts-nocheck` from `Fees.tsx` only.
- **Class-query hooks (preserve):** JS does `fr.querySelector(".fr-track")` and `fr.querySelectorAll(".fr-i")` — the `.fr-track` and `.fr-i` CLASSES must stay on those spans. Keep id `#feesFr`. Keep `id="fees"` (anchor). Keep `class="reveal"`(+`d1`/`d2`/`d3`) hooks.
- Do NOT remove shared CSS: `.section`/`.wrap`/`.reveal*`/`.eyebrow`/`.grad`/`.btn*`. The `.fees .sub` and `.fees-pill .dim` are Fees-SCOPED (no global rule) — remove with Fees. Remove Fees rules `landing.css` ~532–640 + ~1488–1525 (`.fees`/`.fees .wrap`/`.fees .eyebrow`/`.fees h2`/`.fees .sub`/`.fees-pills`/`.fees-pill`(+svg/+.dim)/`.fees-horizon`(+img)/`.fees-glow`/`.fees-fade`/`.fees-rot`(+em)/`.fr`/`.fr-track`/`.fr-i`(+em)) after grep-guard. Do NOT touch `#farmOrbit` (1476, not Fees).
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`; may be slow — wait). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/Fees.tsx` | Rewrite (Tailwind), keep `#feesFr`/`.fr-track`/`.fr-i`/`#fees`/`.reveal` |
| `src/features/landing/landing.css` | Remove Fees rules (~532–640 + ~1488–1525) guarded |

### Task 1: Fees → Tailwind (rotator JS unchanged)
- [ ] **Step 1: Rewrite Fees.tsx** (typed, no `@ts-nocheck`). Keep `<section id="fees">`, `.fees-glow`/`.fees-horizon`(+img orb)/`.fees-fade` decorative layers, the `.eyebrow reveal` label, the `<h2 class="reveal d1 fees-rot">` with the rotator: `<span class="fr" id="feesFr">` → `<span class="fr-track">` (KEEP class) → three `<span class="fr-i">` (KEEP class) each `<em>word</em>`, then `<em>fee.</em>`. Keep the `.sub reveal d2` paragraph and `.fees-pills reveal d3` with three `.fees-pill` (inline SVG + label + `.dim` amount). Reproduce values from `landing.css`: `.fees`(532)/`.fees .wrap`(538)/`.fees .eyebrow`(542)/`.fees h2`(545)/`.fees .sub`(551)/`.fees-pills`(558)/`.fees-pill`(565)+svg(579)+`.dim`(584)/`.fees-horizon`(588)+img(601)/`.fees-glow`(609)/`.fees-fade`(626)/`.fees-rot`(1488)/`.fr`(1491)/`.fr-track`(1499)/`.fr-i`(1504)/`.fees-rot em`(1512)/`.fr-i em`(1519). Token+font caveats. Keep inline `<svg>` verbatim.
  - IMPORTANT: the rotator JS reads `items[n].getBoundingClientRect().width` and sets `track.style.transform`/`fr.style.width` — keep the `.fr`/`.fr-track`/`.fr-i` box model (display, line-height 1.7em rhythm) faithful so the `translateY(-(i*1.7+0.32)em)` math still lands on each word.
- [ ] **Step 2: Remove Fees CSS (guarded).**
  ```bash
  cd tasmil-finance
  for c in 'class="fees' fees-pills fees-pill fees-horizon fees-glow fees-fade fees-rot 'class="fr"' fr-track fr-i; do
    grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Fees.tsx || echo "$c: clear"; done
  ```
  Delete the Fees rules (~532–640 + ~1488–1525). KEEP `.section`/`.wrap`/`.eyebrow`/`.reveal*`/`.btn*` and `#farmOrbit`. Re-grep: `.fees-pill`/`.fr-track` → 0; `.reveal`/`.eyebrow`/`.btn-primary` retained.
- [ ] **Step 3: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 4: Visual + behavior gate** — capture a shot covering `#fees` vs baseline; WATCH the rotator cycle deposit→withdrawal→subscription (each word hugged, `fee.` glides), the orb/glow/fade, the 3 pills. Confirm `.fr-track`/`.fr-i` still found by JS (rotator animates). Leave dev server as found.
- [ ] **Step 5: Commit** — `refactor(landing): convert Fees to Tailwind (rotator JS unchanged)`.

### Task 2: Phase 9 gate
- [ ] `type-check && build` exit 0; Fees no `@ts-nocheck`; `useLandingScripts.ts` untouched; `#fees`/`#feesFr` + `.fr-track`/`.fr-i` classes present; `.fees-pill`/`.fr-track` rules → 0; shared retained. Append Phase 9 completion to ledger.

## Self-Review
- Rotator is inline-style only → NO JS change; `.fr-track`/`.fr-i` class hooks + `#feesFr` preserved. ✓
- `.fr`/`.fr-track`/`.fr-i` box model kept faithful so the translateY rhythm math holds. ✓
- `.sub`/`.dim` are Fees-scoped → removed; shared kept. ✓
- Token/font caveat; inline SVGs verbatim. ✓
- Risk: if the rotator box model drifts, words misalign — the behavior gate (watch the cycle) is the safety net.
