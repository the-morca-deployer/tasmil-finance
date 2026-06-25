# Landing Migration — Phase 6: Features (4 demos + shell) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Largest phase — 5 tasks.

**Goal:** Convert the Features section (`Features.tsx`, 632 lines) + its 4 interactive demos off `landing.css` onto Tailwind, converting every JS-toggled state class to `data-*`, keeping the look + behavior identical.

**Architecture:** 5 tasks — Task A (section shell/frow/panel) first (structural prereq), then Tasks B–E (chat, swap, farm, portfolio demos), each self-contained (distinct wrapper `id`, own JS slice, own CSS ranges). Inline `style.X` writes (transforms, widths, strokeDashoffset) STAY as-is; only state CLASSES become `data-*`. The CSS is interleaved with other sections — remove rule-by-rule per unit, never a contiguous block.

## Global Constraints
- Follow `docs/superpowers/landing-migration-conventions.md`. **Heed the token caveat**: landing `:root` vars (`--muted`/`--bg`/`--dim`/`--text`/`--accent`/`--grad`/`--line`…) ≠ shadcn tokens — reproduce with `[var(--X)]` / exact hex, NOT `text-muted-foreground`/`bg-background`.
- Keep look + behavior identical (qualitative visual gate + manual demo exercise).
- `useLandingScripts.ts` keeps `// @ts-nocheck`; convert ONLY each unit's state-class toggles to `dataset`; keep all `getElementById`/`querySelector` hooks, inline `style.X` writes, `textContent` mutations, timers, and `matchMedia` guards. Remove `// @ts-nocheck` only from `Features.tsx` (done once, in Task A; later tasks edit the already-typed file).
- **Preserve ALL ids + `data-c` attributes** (JS hooks): `#features`, `#chat`,`#chatThread`,`#pcGo`,`#scSign`,`data-c="1..6"`; `#payAmt`,`#recvAmt`,`#payUsd`,`#recvUsd`,`#recvRoute`,`#swapCta`,`#swapFlip`; `#farmPresets`,`#fpThumb`,`#farmApy`,`#farmVal`,`#fb0..3`,`#fp0..3`; `#port`,`#pfVal`,`#pfChart`,`#pfArea`,`#pfLine`,`#pfDot`,`#posDeck`,`#posTrack`,`#posPager`; SVG `#pfStroke`,`#pfFill`.
- **Do NOT remove shared CSS**: `.section`,`.wrap`,`.reveal*`,`.eyebrow`,`.grad`,`.btn*`,`.divider`,`.mono`. Keep the min-width-0 reset rule (lines 531–541) intact — it lists `.panel`/`.chat`/`.swap-field` alongside still-needed selectors; only drop a selector from it once that unit is converted.
- Keep `class="reveal"` on `.sec-head`, `.fviz`, `.ftext` (shared entrance hook; `.reveal*` CSS stays until final cleanup).
- Hard gates: `pnpm type-check` + `pnpm build` (retry on `.next/lock`). Biome disabled for landing — follow conventions manually.
- Branch `feat/landing-tailwind-shadcn-migration`; no push. Capture: `node scripts/landing-visual-capture.mjs <out>` (use `home-1440-features`); baseline `/private/tmp/claude-501/-Users-nathan-Documents-morcalab-tasmil/40076f64-b33f-421b-b510-9d0e17ec3570/scratchpad/baseline/`. Demos are JS-animated → visual AE is triage; manually exercise each demo.

## State-class → `data-*` mapping (the conversion contract)
| Unit | Legacy state class | New | Tailwind variant |
|---|---|---|---|
| Chat | `.cmsg.show` | `msg.dataset.show="true"` | `data-[show=true]:` (display) |
| Chat | `.cmsg.in` | `msg.dataset.in="true"` | `data-[in=true]:` (opacity/transform); `#pcGo` pulse via `[…data-[in=true]…] #pcGo` ancestor |
| Chat | `.sc-sign.signing` | `sign.dataset.signing="true"` | `data-[signing=true]:` |
| Swap | `.sf-amt.zero` | `amt.dataset.zero="true"` | `data-[zero=true]:` |
| Swap | `.swap-flip.spin` | `flip.dataset.spin` toggled | `data-[spin=true]:` |
| Swap | `.swap-cta` `quoting`/`ready` | `cta.dataset.state="idle"/"quoting"/"ready"` | `data-[state=quoting]:` / `data-[state=ready]:` |
| Farm | `.fp-opt.active` | `opt.dataset.active="true"/"false"` | `data-[active=true]:` |
| Portfolio | `.port.in` | `port.dataset.in="true"` | `data-[in=true]:` (drives `.pf-area`/`.pf-dot` via ancestor/group) |
| Portfolio | `.pos-pager i.on` | `dot.dataset.on="true"/"false"` | `data-[on=true]:` |

---

### Task A: Features shell (section, sec-head, frow, panel) → Tailwind
**Files:** Rewrite the shell portions of `Features.tsx` (lines 5–17 shell; the four `.frow` wrappers + `.panel`/`.panel-cap`/`.panel-pad`/`.fhead`/`.flist` structure — keep the demo inner markup untouched for now, only convert the surrounding containers); modify `landing.css` (remove `.frow`/`.panel*`/`.fhead`/`.flist`/`.sec-head` Features rules 484–694 + 578–636, guarded — keep `.section`/`.reveal*`/`.eyebrow`/`.wrap`). Remove `// @ts-nocheck` from Features.tsx.
- Keep `id="features"`, `class="reveal"` on `.sec-head`/`.fviz`/`.ftext`, the `style={{"--i":…}}` per-row.
- Reproduce: `.section`(258, shared-keep), `.sec-head`(271), `.frow`(484–530), responsive frow stacking (542–577), `.fhead`(578–605), `.fp`/`.flist`/`.li`(606–636), `.panel`/`.panel-cap`/`.cap-line`/`.panel-pad`(637–694). The `.reveal` directional slides (240–257) stay in landing.css (shared).
- [ ] Convert shell containers; keep all 4 demo inner blocks as-is (they convert in B–E). [ ] Guard+remove the shell-only Features CSS. [ ] `type-check && build`. [ ] Visual gate `home-1440-features`. [ ] Commit `refactor(landing): convert Features shell (frow/panel) to Tailwind`.

### Task B: Chat thread demo → Tailwind + data-*
**Files:** Chat markup in `Features.tsx` (26–99); JS slice `useLandingScripts.ts` 322–392; `landing.css` 2453–2727.
- Convert state classes per the table (`show`,`in`,`signing`). Keep ids `#chat`,`#chatThread`,`#pcGo`,`#scSign` + `data-c="1..6"`. Keep `thread.style.transform`, `sign.textContent` mutations, the ~11.2s replay timer.
- `.cmsg.in #pcGo` CSS-animation (2649) → express the pulse when the message is in: `data-[in=true]:` on the message ancestor driving `#pcGo` (group/ancestor variant). `.grad` on `.sc-v.grad` stays.
- [ ] JS slice class→dataset. [ ] Convert chat/bub/plan-card/supply-card/sc-* markup+CSS. [ ] Guard+remove 2453–2727 chat rules. [ ] `type-check && build`. [ ] Visual + exercise the chat replay (messages reveal, sign button → "Signing…"). [ ] Commit `refactor(landing): convert Features chat demo to Tailwind + data-*`.

### Task C: Swap pad demo → Tailwind + data-*
**Files:** Swap markup `Features.tsx` 186–293; JS slice 394–520; `landing.css` 914–1145.
- State: `zero` (payAmt/recvAmt), `spin` (swapFlip), swap-cta `quoting`/`ready` → `dataset.state`. Keep ids `#payAmt`,`#recvAmt`,`#payUsd`,`#recvUsd`,`#recvRoute`,`#swapCta`,`#swapFlip`. Keep `route.style.opacity`, all `textContent`, the `matchMedia` reduce guard (line 406) + reduced-motion CSS (1139). `.swap-auto` (1095) is dead (no markup) — guard+remove.
- [ ] JS slice class→dataset (incl. the `swapCta.className="swap-cta quoting/ready"` → `swapCta.dataset.state`). [ ] Convert swap-field/tok/sf-*/swap-* markup+CSS. [ ] Guard+remove 914–1145. [ ] `type-check && build`. [ ] Visual + exercise swap (amounts count up, flip spins, CTA quoting→ready). [ ] Commit `refactor(landing): convert Features swap demo to Tailwind + data-*`.

### Task D: Farm UI demo → Tailwind + data-*
**Files:** Farm markup `Features.tsx` 295–426; JS slice 170–229; `landing.css` 747–913 (+ mobile 570–577).
- State: only `.fp-opt.active` → `dataset.active`. Keep ids `#farmPresets`,`#fpThumb`,`#farmApy`,`#farmVal`,`#fb0..3`,`#fp0..3`. Keep `thumb.style.transform`, `bars[i].style.width`, `textContent`, the rAF APY lerp + setInterval rotators.
- [ ] JS slice `o.classList.toggle("active",…)` → `o.dataset.active = i===idx ? "true":"false"`. [ ] Convert farm-presets/fp-opt/farm-summary/farm-alloc/fa-*/farm-foot markup+CSS. [ ] Guard+remove 747–913. [ ] `type-check && build`. [ ] Visual + exercise (preset rotates, thumb slides, bars/APY update). [ ] Commit `refactor(landing): convert Features farm demo to Tailwind + data-*`.

### Task E: Portfolio / position-deck demo → Tailwind + data-*
**Files:** Portfolio markup `Features.tsx` 428–625; JS slices 231–272 (enter) + 274–298 (carousel); `landing.css` 2728–3012.
- State: `.port.in` (drives `.pf-area`/`.pf-dot` reveal) → `port.dataset.in`; `.pos-pager i.on` → `dot.dataset.on`. Keep ids `#port`,`#pfVal`,`#pfChart`,`#pfArea`,`#pfLine`,`#pfDot`,`#posDeck`,`#posTrack`,`#posPager` + SVG `#pfStroke`/`#pfFill` (keep unique). Keep `line.style.strokeDash*`, `track.style.transform`, `deck.style.height`, `pfVal` count-up. `.port-head`/`.ph-*` (2791) is dead (no markup) — guard+remove.
- `.port.in .pf-area`/`.pf-dot` → `data-[in=true]:` on `#port` ancestor driving the SVG children (group/ancestor variant).
- [ ] JS slices class→dataset. [ ] Convert pf-*/port-sec/pos-*/pg-*/pr-* markup+CSS. [ ] Guard+remove 2728–3012. [ ] `type-check && build`. [ ] Visual + exercise (chart line draws on enter, position deck pages, pager dots). [ ] Commit `refactor(landing): convert Features portfolio demo to Tailwind + data-*`.

### Task F: Phase 6 verification gate
- [ ] `type-check && build` exit 0. [ ] `Features.tsx` no `@ts-nocheck`; `useLandingScripts.ts` keeps it; all listed ids + `data-c` present. [ ] `.frow`/`.chat`/`.swap-pad`/`.farm-ui`/`.port`/`.cmsg`/`.sf-amt`/`.fp-opt`/`.pos-pager` rules → 0 in landing.css; shared (`.section`/`.reveal`/`.grad`/`.btn*`) retained. [ ] Full visual `home-1440-features` vs baseline + exercise all 4 demos. [ ] Append Phase 6 completion to ledger.

## Self-Review
- All 4 demos + shell covered; state-class→`data-*` table is the explicit contract. ✓
- Token caveat (landing vars ≠ shadcn) called out. ✓
- ids/`data-c`/inline-style/textContent/timers/matchMedia preservation explicit per task. ✓
- Dead CSS (`.swap-auto`, `.port-head`) flagged for removal; shared CSS keep-list explicit. ✓
- CSS interleaved → rule-by-rule removal per unit (not block). ✓
- Risk: highest-risk phase; each task's manual demo-exercise gate is the safety net. Tasks B–E independent but run sequentially (no parallel implementers).
