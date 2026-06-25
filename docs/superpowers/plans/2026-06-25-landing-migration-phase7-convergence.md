# Landing Migration — Phase 7: Convergence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert the Convergence section (`Convergence.tsx` + its JS-generated "packet" animation) off `landing.css` onto Tailwind, converting state classes to `data-*`, keeping look + behavior identical.

**Architecture:** Phase 7. Static markup (section/headings/lead/stage/lane/vault/ring) converts normally. The flying "packets" are created imperatively in `useLandingScripts.ts` via `createElement` + `innerHTML` on a 1.05s interval — for those, set the Tailwind class strings INSIDE the JS (className + innerHTML) and convert their state class `iscoin` + the vault `pulse` to `data-*`. The vault is queried by CLASS (`.conv-vault`) — preserve it.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md` (token caveat: landing `:root` vars ≠ shadcn tokens; `font-mono` ≠ landing `--mono`; use `[var(--X)]`/`font-[var(--mono)]`).
- Keep look + behavior identical (qualitative visual + exercise).
- **Class-query hook:** the JS does `stage.querySelector(".conv-vault")` (line 527) — the `.conv-vault` CLASS must stay on the vault div. Before removing ANY class, grep `useLandingScripts.ts` for `querySelector*("\.thatclass")`.
- `useLandingScripts.ts` keeps `// @ts-nocheck`; convert the convergence slice's state toggles: `vault.classList.add/remove("pulse")` → `vault.dataset.pulse`; `pkt.classList.add("iscoin")` → `pkt.dataset.iscoin = "true"`; and set `pkt.className`/innerHTML to the Tailwind class strings (so no `.conv-pkt`/`.cp-*` CSS is needed). Keep all inline `style.X`, timers, `onVisible`, `createElement`/`appendChild`/`remove`. Remove `// @ts-nocheck` only from `Convergence.tsx`.
- Keep ids: `#converge` (anchor), `#convStage`. Keep `class="reveal"` (+ `d1`/`d2` delay classes) on the reveal elements (shared hook — `.reveal*` stays).
- Do NOT remove shared CSS: `.section`/`.wrap`/`.reveal*`/`.ix`/`.lead`/`.grad`/`.btn*` IF used by other sections — grep-guard each. Remove Convergence-specific rules (`.converge`/`.conv-*`/`.cv-ring`/`.cp-*`) after guard.
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`; build may be slow — wait). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/Convergence.tsx` | Rewrite static markup (Tailwind), vault `data-pulse`, keep `#convStage`/`.conv-vault` |
| `src/features/landing/components/useLandingScripts.ts` | Convergence slice: packet className/innerHTML → Tailwind strings; `pulse`/`iscoin` → dataset. Keep `@ts-nocheck`. |
| `src/app/globals.css` | Add `@theme --animate-*` tokens for the convergence keyframes (`cvPulse` etc.) if needed |
| `src/features/landing/landing.css` | Remove `.converge`/`.conv-*`/`.cv-ring`/`.cp-*` rules (guarded) |

### Task 1: Convergence → Tailwind + data-*
**Files:** Rewrite `Convergence.tsx`; modify `useLandingScripts.ts` (convergence slice ~523–586); modify `globals.css` (animate tokens); modify `landing.css` (remove conv rules).
- [ ] **Step 1: Static markup.** Rewrite `Convergence.tsx` (typed, no `@ts-nocheck`). Keep `#converge`, `#convStage`, the `.conv-vault` CLASS on the vault div + `data-pulse="false"` (group), `.conv-lane`, `.cv-ring`, the logo img + "Tasmil Vault" span. Keep `class="ix reveal"` / `reveal d1` / `reveal d2` hooks. Reproduce from `landing.css`: `.converge`(541)/`h2`(545)/`.lead`(552)/`.conv-stage`(559)/`.conv-lane`(566)/`.conv-vault`(575)/`img`(590)/`span`(595)/`.cv-ring`(607)/`.conv-vault.pulse .cv-ring`(615→`group-data-[pulse=true]:` or `data-[pulse=true]:` on the ring). The `cvPulse` keyframe is already in globals.css — apply via animate token/utility.
- [ ] **Step 2: Convergence JS slice.** In `useLandingScripts.ts` (~523–586): set `pkt.className = "<tailwind utilities reproducing .conv-pkt>"` and `pkt.innerHTML = '<div class="<cp-logo tailwind>"><img …></div><div class="<cp-coin tailwind>"></div>'` so no `.conv-pkt`/`.cp-*` CSS is needed (reproduce the `.conv-pkt`(619)/`.cp-logo`/`.cp-coin`(672–680) + `.iscoin` morph). Convert `pkt.classList.add("iscoin")` → `pkt.dataset.iscoin = "true"` (and the morph styled via the inline class string's `data-[iscoin=true]:` variants — set them in the className string). Convert `vault.classList.add/remove("pulse")` → `vault.dataset.pulse = "true"/"false"`. Keep all inline styles, timers, onVisible, createElement/appendChild/remove, `@ts-nocheck`.
  - NOTE: if reproducing the `.iscoin` coin-morph via inline Tailwind data-variants on a JS-created node proves unreliable (data-variant requires the attr present before paint), it's acceptable to add a small `@utility conv-pkt`/`@utility conv-coin` in `globals.css` instead and apply those utility classes — that still removes the rules from `landing.css`. Report which approach you used.
- [ ] **Step 3: Remove conv CSS (guarded).** Grep-guard `.converge`/`.conv-stage`/`.conv-lane`/`.conv-vault`/`.cv-ring`/`.conv-pkt`/`.cp-logo`/`.cp-coin` used by no other component; grep-guard `.ix`/`.lead` (likely shared — keep if used elsewhere). Remove the Convergence rules. Re-grep: `.conv-vault`/`.conv-pkt` rules → 0; shared `.reveal`/`.section`/`.btn-primary` retained.
- [ ] **Step 4: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 5: Visual + behavior gate** — capture a shot covering `#converge` vs baseline; WATCH the demo — protocol packets fly across the lane into the vault, morph to coins (`data-iscoin`), the vault pulses (`data-pulse`); confirm `.conv-vault` is still found by JS (demo animates). Leave dev server as found.
- [ ] **Step 6: Commit** — `refactor(landing): convert Convergence to Tailwind + data-* (packets in JS)`.

### Task 2: Phase 7 gate
- [ ] `type-check && build` exit 0; `Convergence.tsx` no `@ts-nocheck`; `useLandingScripts.ts` keeps it; `#converge`/`#convStage` + `.conv-vault` class present; `.converge`/`.conv-*`/`.cp-*` rules → 0; shared retained. Append Phase 7 completion to ledger.

## Self-Review
- Static markup + JS-island packets both converted; `.conv-vault` class hook preserved; `pulse`/`iscoin` → data-*. ✓
- Token/font caveat called out; JS-created node data-variant caveat handled with the `@utility` fallback. ✓
- `.ix`/`.lead` guarded (may be shared); `.reveal` kept. ✓
- Risk: the JS-generated packet morph is the trickiest — Step 2's `@utility` fallback + the behavior gate are the safety nets.
