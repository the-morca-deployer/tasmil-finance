# Landing Migration — Phase 10: FAQ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Convert the FAQ section (`Faq.tsx`, accordion + search) off `landing.css` onto Tailwind, converting `open`/`show` state classes to `data-*`, keeping look + behavior identical.

**Architecture:** Phase 10. The FAQ is a custom single-open accordion + live search filter driven by existing JS. We KEEP the custom structure (not shadcn `Collapsible` — the conventions suggest Collapsible, but the JS single-open + search-filter behavior is preserved more faithfully with the existing markup; this is a justified deviation). Convert styling to Tailwind and the two state classes to `data-*`.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md` (token caveat: landing `:root` vars ≠ shadcn tokens; `font-mono` ≠ `--mono`; use `[var(--X)]`/`font-[var(--mono)]`).
- Keep look + behavior identical (qualitative visual + exercise the accordion + search).
- `useLandingScripts.ts` keeps `// @ts-nocheck`; convert the FAQ slice's state toggles: `item.classList.toggle("open", open)` → `item.dataset.open = open ? "true" : "false"`; `item.classList.contains("open")` → `item.dataset.open === "true"`; `empty.classList.toggle("show", shown===0)` → `empty.dataset.show = shown===0 ? "true" : "false"`. Keep `item.style.display` (search filter, inline), all listeners. Remove `// @ts-nocheck` from `Faq.tsx` only.
- **Class-query hooks (preserve):** JS does `faqList.querySelectorAll(".faq-item")` and `item.querySelector(".faq-q")` — the `.faq-item` and `.faq-q` CLASSES must stay. Keep ids `#faqList`, `#faqSearch`, `#faqEmpty`, `#faq`. (Before removing ANY class, grep `useLandingScripts.ts` for `querySelector*("\.thatclass")`.)
- The first `.faq-item` ships open (`data-open="true"`); all others `data-open="false"`. `#faqEmpty` ships `data-show="false"`.
- Do NOT remove shared CSS: `.section`/`.wrap`/`.reveal*`/`.eyebrow`/`.grad`/`.btn*`. Remove FAQ rules `landing.css` ~533–760 (`.faq-head`(+`.eyebrow`/`h2`/`em`/`.fsub`)/`.faq-search`(+svg/input/placeholder/focus)/`.faq-list`/`.faq-item`(+::before/::after)/`.faq-q`(+hover/`.faq-toggle`±)/`.faq-a`(+inner/a)/`.faq-empty`(+show)/`.faq-foot`(+a)) after grep-guard. NOTE `.faq-head .eyebrow` is a SCOPED override — verify whether the bare `.eyebrow` (shared) suffices or the scoped tweak must be reproduced inline.
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`; may be slow — wait). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>`; baseline at `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`.

## File Structure
| File | Action |
|---|---|
| `src/features/landing/components/Faq.tsx` | Rewrite (Tailwind), `data-open` per item + `data-show` on empty; keep `.faq-item`/`.faq-q` classes + ids |
| `src/features/landing/components/useLandingScripts.ts` | FAQ slice: `open`/`show` class → dataset. Keep `@ts-nocheck`. |
| `src/features/landing/landing.css` | Remove FAQ rules (~533–760) guarded |

### Task 1: FAQ → Tailwind + data-open/data-show
- [ ] **Step 1: FAQ JS slice** (~620–655). `setOpen`: `item.classList.toggle("open", open)` → `item.dataset.open = open ? "true" : "false"`. The toggle read `!item.classList.contains("open")` → `item.dataset.open !== "true"`. `empty.classList.toggle("show", shown===0)` → `empty.dataset.show = shown===0 ? "true" : "false"`. Keep `item.style.display = match ? "" : "none"`, all listeners, the `q ? setOpen(item,match)` filter behavior, the reset-to-first-open. Keep `@ts-nocheck`.
- [ ] **Step 2: Rewrite Faq.tsx** (typed, no `@ts-nocheck`). Keep `<section id="faq">`, `.faq-head reveal` (+ `.eyebrow`/`h2 em`/`.fsub`), `.faq-search` with `<input id="faqSearch">` + inline search svg, `.faq-list reveal d1 id="faqList"`, the 8 `.faq-item` (KEEP class; add `data-open="false"` except first = `"true"`) each with `<button class="faq-q">` (KEEP class) + `.faq-toggle` (the ± icon via `before:`/`after:` pseudo + `data-[open=true]:` rotate) + `.faq-a` → `.faq-a-inner` (the answer, collapsed by default, expanded via `data-[open=true]:`). Then `#faqEmpty` (`data-show="false"`) + `.faq-foot`. Reproduce values from `landing.css` 533–760 (token+font caveats). The accordion expand (`.faq-item.open .faq-a` at 710 — likely grid-rows/max-height): reproduce with `data-[open=true]:` on the item driving `.faq-a` (group/ancestor variant or directly since the item carries data-open). Keep inline SVGs verbatim.
- [ ] **Step 3: Remove FAQ CSS (guarded).**
  ```bash
  cd tasmil-finance
  for c in faq-head faq-search faq-list 'class="faq-item' faq-q faq-toggle faq-a faq-empty faq-foot; do
    grep -rln "$c" src/features/landing/components | grep -E '\.tsx$' | grep -v Faq.tsx || echo "$c: clear"; done
  ```
  Delete FAQ rules (~533–760). Keep `.section`/`.wrap`/`.eyebrow`/`.reveal*`/`.btn*`. Re-grep: `.faq-item`/`.faq-q` rules → 0; shared retained.
- [ ] **Step 4: Hard gates** — `pnpm type-check && pnpm build` exit 0.
- [ ] **Step 5: Visual + behavior gate** — capture a shot covering `#faq` vs baseline; EXERCISE: click a question → it opens, others close (single-open), the ± toggle animates; type in search → non-matching items hide, matching open, empty state shows when 0 results; clear search → first item re-opens. Confirm `.faq-item`/`.faq-q` found by JS. Leave dev server as found.
- [ ] **Step 6: Commit** — `refactor(landing): convert FAQ to Tailwind + data-open/data-show`.

### Task 2: Phase 10 gate
- [ ] `type-check && build` exit 0; FAQ no `@ts-nocheck`; `useLandingScripts.ts` keeps it; `#faqList`/`#faqSearch`/`#faqEmpty` + `.faq-item`/`.faq-q` classes present; `.faq-item`/`.faq-q` rules → 0; shared retained. Append Phase 10 completion to ledger.

## Self-Review
- Accordion + search state (`open`/`show`) → `data-*`; class hooks `.faq-item`/`.faq-q` + ids preserved; `item.style.display` filter kept. ✓
- Justified deviation from Collapsible (single-open + search JS preserved with existing structure) noted. ✓
- ± toggle (pseudo-element rotate) + expand via `data-[open=true]:`; inline SVGs verbatim. ✓
- Token/font caveat; shared CSS guarded. ✓
- Risk: the expand animation + single-open + search-filter interplay — the behavior gate (exercise all paths) is the safety net.
