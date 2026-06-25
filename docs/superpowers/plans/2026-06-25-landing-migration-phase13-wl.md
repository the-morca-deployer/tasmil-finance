# Landing Migration — Phase 13: wl/ (waitlist + access) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Large phase (~11 tasks).

**Goal:** Convert the `wl/` world (the `/waitlist` and `/access` pages, scoped under `.wl-page`) off `landing.css` onto Tailwind, so the entire contiguous `.wl-page` CSS block (lines 549–3787) can be removed, keeping look + behavior identical.

**Architecture:** Phase 13. **wl/ JS is 100% inline React** (per-component `useState`/`useEffect`) — it does NOT use `useLandingScripts.ts` at all, so that file is UNTOUCHED this phase. State classes (`.nav.scrolled`, `.wl-sidebar.open`, `.cohort-row.peak`, `.step.active/.done`, `.step-line.filled`, `.beams-off`, `.fa-cols.in`) are set via React conditional `className` — reproduce as Tailwind via conditional `className={cn(...)}` (no DOM manipulation). The ONLY `classList.add` is `Footer`'s `auroraRef.current.classList.add("in")` (a React ref, not a query) — convert to React state + data-attr, or keep the class hook.

**Files (in `src/features/landing/`):** `components/wl/shared.tsx` (894 — Nav, Footer, BgFX, BeamsBg, useAccent, useToast, Stepper, the SVG anim components), `components/wl/landing.tsx` (417 — Hero, ReferralLoop, WhyJoin), `components/wl/access.tsx` (421 — AccessPage/AccessFlow), `components/ui/stepper.tsx` (55, possibly unused — verify), `components/animations/svg-anims.tsx` (231, possibly unused — verify), **plus** the `WaitlistPhaseBoard` + `waitlist-screen*.tsx` sub-tree lazy-loaded in Hero (find via `grep -rl WaitlistPhaseBoard src/features`).

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md` — token caveat (landing/wl `:root` vars ≠ shadcn tokens; `font-mono` ≠ `--mono`; **gradient-via-var:** `[background:var(--grad)]`/`[background-image:var(--grad)]`, NEVER `bg-[var(--grad)]`).
- Keep look + behavior identical (qualitative visual + exercise: nav scroll/sidebar, access wallet→code→done flow, waitlist board).
- **`useLandingScripts.ts` is NOT touched this phase** (wl/ has its own inline JS).
- Remove `// @ts-nocheck` from each converted wl/ file.
- **State via React (not DOM):** reproduce conditional classes with `className={cn("base-tailwind", cond && "state-tailwind")}` — no `data-*` round-trip needed since it's already React state. (Exception: Footer's `auroraRef.classList.add("in")` — convert to a `useState(inView)` + conditional Tailwind, or keep `.fa-cols`/`.in` as the ref hook.)
- **Keep the 24 `wl-*` keyframes in `globals.css`** (already relocated Phase 0); apply via `animate-[wl-…]` / `@theme` tokens. Keep the `@media (prefers-reduced-motion)` gating and the `[data-motion="off"]`/`[data-grid="off"]` data-attribute overrides on `.wl-page` (these are static route attributes — reproduce as data-variants or keep).
- **FIX the `scan-wl-spin` naming bug** if ScanAnim is kept (animation references `scan-wl-spin`, keyframe is `wl-scan-spin`) — but ScanAnim is DEAD in current pages, so removing it resolves it.
- **`.wl-page` block is CONTIGUOUS (549–3787, end of file) + a redundant second `:root`/reset (552–605).** Remove rules per-unit as converted; the FINAL wl/ task removes the remaining block + the redundant `:root`/reset, leaving only the main-landing `.landing-page` shared rules + the first `:root` (which Phase 14 handles).
- **DEAD `.wl-page` CSS to remove** (Explore-confirmed; ~40 blocks): `.bg-glow.g1`, `.bg-vignette`, `.hero-desc`, `.trust`, `.board-top`/`.tag`, `.screen-foot`, `.foot`/`.foot-inner`/`.foot-copy`, `.foot-contract`/`.cdot`/`.foot-bottom`/`.foot-legal`/`.copy`/`.foot-x`/`.foot-ghost`, `.access-meta`/`.row`/`.ic`, `.hint-chip`, `MailAnim` (`.bell-*`/`.bw*`), `ScanAnim` (`.scan-*`), `CheckAnim` (`.check-anim`/`.ca-*`), `CongratsAnim` (`.congrats-anim`/`.cg-*`), `PulseGlyph` (`.pulse-glyph`/`.pg-*`), `.scanner`/`.ring`/`.core`, `.addr-pill`, `.gate-note`, `.pill`, `.seg`, `.field-lbl`, `.skip`, `.shake`, `.btn-quiet`, `.referral`/`.loop-steps`/`.loop-step`/`.loop-num`, `.ladder`/`.tier`, `.brand-mark`. **VERIFY each via grep before removing** — some "dead-looking" classes (`.board`/`.screen`/`.climb`/`.stat-duo`/`.field`/`.btn-sm`/`.ref-link`/`.email-mini`/`.done-head`) ARE used by the `WaitlistPhaseBoard`/`waitlist-screen*` sub-tree — do NOT remove those until those components are converted.
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`; may be slow — wait). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>` (shots: `waitlist-1440`/`waitlist-390`/`access-1440`/`access-390`); baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## Task Split (each its own subagent task; convert, then remove that unit's CSS, gate)
- **T0 — Recon:** `grep -rl "WaitlistPhaseBoard\|waitlist-screen" src/features` to enumerate the board sub-tree; confirm which Stepper impl (`shared.tsx` vs `ui/stepper.tsx`) and which anim file (`shared.tsx` vs `animations/svg-anims.tsx`) the routes actually use (Explore says `shared.tsx` for both; `ui/stepper.tsx` + `animations/svg-anims.tsx` appear UNUSED → candidate deletes). Update the dead list.
- **T1 — BgFX** (shared.tsx): 8 rules, no state. Remove dead `.bg-glow.g1`/`.bg-vignette`.
- **T2 — Nav + wl-sidebar** (shared.tsx): `.scrolled`/`.open` via React state → conditional Tailwind; mobile breakpoints (use `max-[Npx]:`, NOT named `sm/md/lg`); body scroll-lock inline stays; buttons → shadcn or keep `.btn` (shared).
- **T3 — Hero** (landing.tsx): beams/veil/fade/title/proto-stack(+tooltip CSS hover)/social-row; `id="top"` kept. Remove dead `.hero-desc`/`.trust`.
- **T4 — ReferralLoop** (landing.tsx): loop3/cohorts/points/wl-rules; `.cohort-row.peak` static class → conditional Tailwind; `id="how"`. Remove dead `.referral`/`.ladder`/`.tier`.
- **T5 — WhyJoin** (landing.tsx): why-grid/feature(+hover); `id="why"`. Small.
- **T6 — Footer** (shared.tsx): brand/cols/aurora; `.fa-cols.in` (auroraRef) → React `useState(inView)` + conditional Tailwind (or keep ref+class). Remove dead `.foot-contract`/`.foot-ghost`/`.foot-bottom`/`.foot-legal`/`.foot-x`/`.foot`/`.foot-inner`.
- **T7 — Anim components** used by /access: WalletAnim, KeyAnim, PopperAnim (shared.tsx). Keep `wl-*` keyframes + reduced-motion + `[data-motion="off"]`. Remove DEAD anim CSS (MailAnim/ScanAnim/CheckAnim/CongratsAnim/PulseGlyph).
- **T8 — Stepper** (shared.tsx internal): `.step.active/.done`/`.step-line.filled` static classes → conditional Tailwind. Delete unused `ui/stepper.tsx` + `animations/svg-anims.tsx` if T0 confirms unused.
- **T9 — AccessFlow/AccessPage** (access.tsx): depends on T7/T8; screen wallet→code→done (`useState(screen)`); `.screen` wl-rise; seat-pass; CodeInput already inline; SVG gradient ids kept. Remove dead `.board-top`/`.screen-foot`/`.access-meta`/`.hint-chip`.
- **T10 — WaitlistPhaseBoard + waitlist-screen\*** (the board sub-tree from T0): `.board`/`.screen`/`.climb`/`.stat-duo`/`.field`/`.ref-link`/`.email-mini`/`.btn-sm` etc. Convert these so their CSS can be removed.
- **T11 — useToast/useAccent**: NO CSS work (Toast is 100% inline; useAccent sets `--h` var). Just remove `@ts-nocheck` from shared.tsx once all its exports are converted.
- **T12 — Final wl/ sweep + gate:** remove the remaining `.wl-page` block (549–3787) + redundant `:root`/reset (552–605); `type-check && build`; visual `waitlist`/`access` shots vs baseline; exercise both pages. Append Phase 13 completion to ledger.

## Self-Review
- wl/ is inline-React → no useLandingScripts change; state via conditional Tailwind. ✓
- Contiguous `.wl-page` block removed per-unit, remainder swept in T12; redundant `:root`/reset removed. ✓
- Large dead-CSS list (grep-verified per unit); WaitlistPhaseBoard sub-tree classes protected until T10. ✓
- `wl-*` keyframes + reduced-motion + `[data-motion/grid="off"]` preserved; scan naming bug resolved by removing dead ScanAnim. ✓
- Token/font/gradient caveats; `max-[Npx]:` breakpoints (not named). ✓
- Risk: AccessFlow screen transitions + the board sub-tree are the most complex — their behavior gates (exercise the flow) are the safety nets.
