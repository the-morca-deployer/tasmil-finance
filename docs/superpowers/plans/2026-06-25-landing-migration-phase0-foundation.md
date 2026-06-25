# Landing Migration — Phase 0: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the safe foundation for migrating the landing page off `landing.css` to Tailwind + shadcn — back up the stylesheet, capture a visual baseline, relocate all `@keyframes` to `globals.css`, and document the conversion conventions — **without changing any visible output**.

**Architecture:** This is the enabling PR of a multi-phase program (Approach A, foundation-first). Phase 0 produces a reviewable, look-neutral refactor: keyframes move to the app-standard location (`globals.css`), a backup + baseline make every later phase verifiable and revertible, and a conventions doc locks the per-section conversion rules. No component markup changes here.

**Tech Stack:** Next.js 16, Tailwind v4 (`@theme`/`@utility` in `globals.css`), shadcn-style primitives in `src/shared/ui/`, Biome, chrome-devtools MCP for screenshots.

## Global Constraints

- **Keep look identical** — Phase 0 must produce zero visible change; verify by before/after screenshot at 3 breakpoints.
- **Do not import the backup** — `landing.legacy.css.bak` must never be imported anywhere; it exists only for diff/revert.
- **Keyframe namespace is global** — moving a `@keyframes` block from `landing.css` to `globals.css` keeps existing `animation:` references working; do not rename keyframes in this phase.
- **Biome conventions** — 2-space indent, line width 100, double quotes, `import type`, no `any`, no `console.log`.
- **Quality gate per task** — the touched-area gate command listed in the task must pass before commit.
- **Branch** — work on `feat/landing-tailwind-shadcn-migration` (already created). Do not push to `deploy/prod`.
- **Repo root for all paths** — `tasmil-finance/`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/features/landing/landing.css` | Current landing stylesheet (source of truth this phase shrinks) | Modify (remove `@keyframes` blocks) |
| `src/features/landing/landing.legacy.css.bak` | Verbatim, un-imported backup of the original stylesheet for revert | Create |
| `src/app/globals.css` | App-standard home for keyframes/utilities | Modify (add 35 `@keyframes`) |
| `docs/superpowers/landing-migration-conventions.md` | The per-section conversion playbook every later phase follows | Create |
| `<scratchpad>/baseline/` | Before-migration screenshot artifacts | Create (out of repo) |

Scratchpad dir for this session:
`/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad`

---

### Task 1: Back up `landing.css` for revert

**Files:**
- Create: `src/features/landing/landing.legacy.css.bak`

**Interfaces:**
- Consumes: nothing.
- Produces: `landing.legacy.css.bak` — a byte-identical, un-imported copy of `landing.css` used by later phases and revert.

- [ ] **Step 1: Copy the stylesheet verbatim**

```bash
cd tasmil-finance
cp src/features/landing/landing.css src/features/landing/landing.legacy.css.bak
```

- [ ] **Step 2: Verify the copy is byte-identical**

Run:
```bash
diff -q src/features/landing/landing.css src/features/landing/landing.legacy.css.bak && echo IDENTICAL
```
Expected: `IDENTICAL` (diff prints nothing, `&&` branch runs).

- [ ] **Step 3: Verify the backup is not imported anywhere**

Run:
```bash
grep -rn "landing.legacy.css" src/ || echo "NOT IMPORTED — good"
```
Expected: `NOT IMPORTED — good`.

- [ ] **Step 4: Commit**

```bash
git add src/features/landing/landing.legacy.css.bak
git commit -m "chore(landing): archive landing.css as un-imported backup for revert"
```

---

### Task 2: Capture the visual baseline

**Files:**
- Create (out of repo): `<scratchpad>/baseline/*.png`
- Create: `<scratchpad>/baseline/MANIFEST.md` (list of shots + the exact viewport/route/state each represents)

**Interfaces:**
- Consumes: nothing.
- Produces: a baseline screenshot set every later phase diffs against. MANIFEST defines the canonical capture list reused verbatim in each section PR.

- [ ] **Step 1: Start the dev server in the background**

Run:
```bash
cd tasmil-finance && pnpm dev
```
(run in background). Expected: Turbopack ready on `http://localhost:3000`. Wait until the port responds:
```bash
until curl -sf http://localhost:3000 >/dev/null; do sleep 2; done; echo READY
```
Expected: `READY`.

- [ ] **Step 2: Capture the canonical shot list via chrome-devtools MCP**

For each row below: use `navigate_page` to the route, `resize_page` to the width (height 900), drive the state, then `take_screenshot` (fullPage) saving to `<scratchpad>/baseline/<name>.png`.

| name | route | width | state to drive before shot |
|---|---|---|---|
| `home-1440` | `/` | 1440 | none (top of page) |
| `home-768` | `/` | 768 | none |
| `home-390` | `/` | 390 | none |
| `home-1440-scrolled` | `/` | 1440 | scroll down ~600px (nav enters `scrolled`) |
| `home-390-sidebar` | `/` | 390 | click `.nav-burger` (sidebar opens) |
| `home-1440-faq-open` | `/` | 1440 | scroll to FAQ, click first question (expands) |
| `home-1440-cta-hover` | `/` | 1440 | hover the primary CTA in CTA section |
| `home-1440-features` | `/` | 1440 | scroll to Features; let demos settle ~2s |
| `waitlist-1440` | `/waitlist` | 1440 | none |
| `waitlist-390` | `/waitlist` | 390 | none |
| `access-1440` | `/access` | 1440 | none |
| `access-390` | `/access` | 390 | none |

Use `evaluate_script` with `window.scrollTo(0, N)` for scroll states; `click`/`hover` via snapshot uids for interactions.

- [ ] **Step 3: Write the baseline MANIFEST**

Create `<scratchpad>/baseline/MANIFEST.md` listing every shot name with its route, viewport (`WxH`), and the exact state-driving steps from the table. Later phases re-capture this exact list as "after" shots.

- [ ] **Step 4: Verify all shots exist**

Run:
```bash
ls <scratchpad>/baseline/*.png | wc -l
```
Expected: `12`.

- [ ] **Step 5: Commit the manifest reference (artifacts stay out of repo)**

Baseline PNGs live in scratchpad (not committed). Record the manifest contents into the repo so the shot list is durable:
```bash
cp <scratchpad>/baseline/MANIFEST.md docs/superpowers/landing-baseline-manifest.md
git add docs/superpowers/landing-baseline-manifest.md
git commit -m "docs(landing): record visual baseline capture manifest"
```

---

### Task 3: Relocate all `@keyframes` from `landing.css` to `globals.css`

**Files:**
- Modify: `src/features/landing/landing.css` (remove the 35 `@keyframes` blocks)
- Modify: `src/app/globals.css` (append the 35 `@keyframes` blocks verbatim)

**Interfaces:**
- Consumes: nothing.
- Produces: all 35 keyframes (`spin`, `heroFloaty3d`, `heroLabFloat`, `cue`, `rise`, `cvPulse`, `ticker`, `typ`, `pcPulse`, `plFloat`, `plBar`, and the 24 `wl-*`) defined in `globals.css`. Existing `animation:` references in the remaining `landing.css` continue to resolve via the global keyframe namespace. Later phases add `@theme --animate-<name>` tokens only when a component switches to the `animate-<name>` utility.

- [ ] **Step 1: Snapshot the current keyframe inventory**

Run:
```bash
cd tasmil-finance
grep -nE "@keyframes" src/features/landing/landing.css | wc -l   # expect 35
grep -nE "@keyframes" src/app/globals.css | wc -l                # baseline count to compare against later
```
Expected: first command prints `35`.

- [ ] **Step 2: Move each `@keyframes` block verbatim**

For each `@keyframes <name> { … }` block in `landing.css`: cut the entire block (from the `@keyframes` line through its closing `}`) and paste it verbatim into `globals.css`, in a clearly delimited section appended after the existing keyframes, e.g.:

```css
/* ===== Landing keyframes (relocated from features/landing/landing.css) ===== */
@keyframes heroFloaty3d {
  /* …exact body, unchanged… */
}
/* …remaining 34 blocks, verbatim… */
```

Do **not** alter keyframe names, percentages, or property values. Move the body exactly as written.

- [ ] **Step 3: Verify the move is complete and lossless**

Run:
```bash
grep -cE "@keyframes" src/features/landing/landing.css   # expect 0
grep -cE "@keyframes" src/app/globals.css                # expect baseline + 35
```
Expected: `landing.css` → `0`; `globals.css` increased by exactly `35`.

Confirm no keyframe name was lost — every name still defined exactly once:
```bash
grep -oE "@keyframes [a-zA-Z0-9_-]+" src/app/globals.css | sort | uniq -d
```
Expected: no output (no duplicates).

- [ ] **Step 4: Build to verify no CSS breakage**

Run:
```bash
pnpm build
```
Expected: build succeeds (exit 0), no Tailwind/CSS parse errors.

- [ ] **Step 5: Visual no-change check**

With dev server running, re-capture `home-1440`, `home-390`, `home-1440-features`, `waitlist-1440`, `access-1440` (the animation-bearing shots) and compare against `<scratchpad>/baseline/`. Expected: visually identical (animations still play; no missing motion).

- [ ] **Step 6: Commit**

```bash
git add src/features/landing/landing.css src/app/globals.css
git commit -m "refactor(landing): relocate @keyframes to globals.css (app-standard location)"
```

---

### Task 4: Write the conversion conventions playbook

**Files:**
- Create: `docs/superpowers/landing-migration-conventions.md`

**Interfaces:**
- Consumes: the spec at `docs/superpowers/specs/2026-06-25-landing-tailwind-shadcn-migration-design.md`.
- Produces: the single playbook every section PR (Phases 1–14) follows. Defines the shadcn-primitive mapping, the `data-*` state convention, and the per-section checklist. Later plans reference this file by path instead of repeating the rules.

- [ ] **Step 1: Write the conventions document**

Create `docs/superpowers/landing-migration-conventions.md` with these sections, filled in concretely:

1. **Primitive mapping table** (copy from spec §3.1): `.btn.btn-primary` → `<Button asChild variant="gradient">` + className override; `.btn-ghost` → `<Button asChild variant="ghost"|"outline">`; `.hero-pill`/`.eyebrow`/`.overline` → `<Badge variant="outline">` + override; card/panel → `<Card>` or `<div>` + utility; FAQ → `Collapsible`; layout/spacing/color/type → Tailwind token utilities.
2. **Override rule:** use the shadcn component as the structural/behavioral primitive; pass Tailwind utilities via `className` to preserve the exact legacy look. Use a variant's default look only where it already matches.
3. **Token-first rule:** prefer `text-primary`/`bg-card`/`border-border`/`text-muted-foreground` over hardcoded values; arbitrary `[…]` only when no token expresses the original.
4. **State → `data-*` convention:** `useLandingScripts.ts` sets `el.dataset.<key>` instead of toggling state classes; markup reads via Tailwind data-variants. Concrete pairs: `data-scrolled="true"`↔`data-[scrolled=true]:…`; `data-state="open"`↔`data-[state=open]:…`; `data-inview="true"`↔`group-data-[inview=true]:…`.
5. **Animation rule:** keyframes live in `globals.css`; expose `@theme { --animate-<name>: <name> <dur> <easing> … }` when a component adopts the `animate-<name>` utility; complex repeated effects → `@utility` in `globals.css`; simple pseudo-elements → `before:`/`after:` variants inline.
6. **Per-section checklist (Definition of Done for a section PR):**
   - [ ] Component(s) use Tailwind token + shadcn primitive; no `// @ts-nocheck`; Biome clean.
   - [ ] State driven by `data-*` (no legacy state classes remain for this section).
   - [ ] This section's rules removed from `landing.css`.
   - [ ] After-screenshots re-captured for this section's relevant shots, visually match baseline.
   - [ ] `pnpm type-check`, `pnpm lint`, `pnpm build` pass.

- [ ] **Step 2: Verify completeness (no placeholders)**

Run:
```bash
grep -niE "TODO|TBD|fill in|placeholder" docs/superpowers/landing-migration-conventions.md || echo "CLEAN"
```
Expected: `CLEAN`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/landing-migration-conventions.md
git commit -m "docs(landing): add Tailwind+shadcn conversion conventions playbook"
```

---

### Task 5: Phase 0 verification gate

**Files:** none (verification only).

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a green foundation that Phase 1 builds on.

- [ ] **Step 1: Full quality gate**

Run:
```bash
cd tasmil-finance
pnpm type-check && pnpm lint && pnpm build
```
Expected: all three pass (exit 0).

- [ ] **Step 2: Confirm Phase 0 invariants**

Run:
```bash
# landing.css still imported and intact (minus keyframes)
grep -rn "landing.css\"" src/app/"(landing-page)"/layout.tsx
# keyframes fully relocated
grep -cE "@keyframes" src/features/landing/landing.css   # expect 0
# backup present and un-imported
test -f src/features/landing/landing.legacy.css.bak && echo "BACKUP OK"
grep -rn "landing.legacy.css" src/ || echo "BACKUP NOT IMPORTED — good"
```
Expected: layout still imports `landing.css`; keyframes count `0`; `BACKUP OK`; `BACKUP NOT IMPORTED — good`.

- [ ] **Step 3: Final visual no-change confirmation**

Re-capture the full 12-shot baseline list (Task 2 table) as `<scratchpad>/after-phase0/` and confirm each matches `<scratchpad>/baseline/`. Expected: zero visible difference across all 12.

- [ ] **Step 4: Stop the dev server**

Stop the background `pnpm dev` process.

---

## Self-Review

**Spec coverage (Phase 0 scope only):**
- Spec §5 (backup/revert) → Task 1. ✓
- Spec §4 (baseline screenshots) → Task 2. ✓
- Spec §3.2 (keyframes → globals.css) → Task 3. ✓
- Spec §3.1 + §3.3 (conversion + `data-*` conventions documented) → Task 4. ✓
- Spec §4 quality gates → Task 5. ✓
- Spec §6 Phases 1–14 (component/JS conversion) → **out of scope for this plan**, each gets its own just-in-time plan referencing `landing-migration-conventions.md`.

**Placeholder scan:** No "TBD/TODO" in plan steps; conventions doc explicitly grep-checked for placeholders in Task 4 Step 2. ✓

**Type/name consistency:** No code symbols defined across tasks; shared artifact names (`landing.legacy.css.bak`, `landing-migration-conventions.md`, baseline shot names) are used consistently between tasks and match the spec. ✓

**Note on TDD:** This phase is a CSS relocation + tooling setup with no unit-testable logic; verification gates are grep assertions, `pnpm build`, and screenshot diffs rather than failing-first unit tests. Component/JS phases (later plans) will use behavioral checks where logic exists.
