# Phase 2: Native Quest (De-iframe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Bring the quest user app (explore/campaigns, campaign detail, profile, visit/task flow, social OAuth) natively into `tasmil-finance` under `/quest/*`, reskinned to the app theme, replacing the external `quest.tasmil-finance.xyz` link. The quest leaderboard is already native; admin quest management already exists.

**Architecture:** Port from the quest source repo into `src/features/quest` (extending the existing leaderboard-only feature). Add a generated `gen-quest` client (copy the source's pre-generated `src/gen`, 183 files) talking to the quest backend via `NEXT_PUBLIC_QUEST_API_URL`. Reskin quest's local `components/ui/*` to the app's `@/shared/ui/*`. Reconcile quest's `WalletContext`/stores to the app's `@/shared/context/wallet-context` (a superset). Mount routes under a `/quest/*` path space.

**Tech Stack:** Next 16, React 19, @tanstack/react-query, kubb `gen-quest`, stellar-wallets-kit, Biome.

## Global Constraints
- Branch from `origin/deploy/staging`; this work continues on `feat/merge-landing-quest` (or a new `feat/quest-native` cut from staging). PR into `deploy/staging`, never `deploy/prod`.
- Biome: 2-space, width 100, double quotes, `import type`, no `any`, no `console.log`. Format ONLY touched files (`pnpm exec biome check --write <paths>`); never repo-wide `check:fix`. Stage explicit paths, never `git add -A`.
- Features never import other features; cross-cutting code in `src/shared/`. `gen-quest` is generated - add to biome lint-disable override like other `gen-*`.
- English-only copy. `pnpm type-check` + `pnpm build` are the hard gates (Vercel runs build). Husky is disabled locally; there is no PR lint/test CI - build is authoritative.
- SOURCE quest repo (read-only): `/Users/nathan/Documents/morcalab/tasmil/tasmil-quest-folder/frontend`. TARGET: `/Users/nathan/Documents/morcalab/tasmil/tasmil-finance`.
- Already on staging - do NOT duplicate: quest leaderboard (`features/quest` + `(dashboard)/quest`), admin quest (`admin/(app)/quest-campaigns`, `quests`, `quest-stats`).

## External dependencies (flag, don't block)
- **Social OAuth** (`/api/auth/discord|telegram|x` + callbacks) needs server secrets: `DISCORD_CLIENT_ID/SECRET`, `X_CLIENT_ID/SECRET`, `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`. Port the routes; they compile without secrets but won't function until env is set and OAuth redirect URIs are updated. Document in PR.
- **`gen-quest` direct client needs CORS** on the quest backend (`:5555`) for the app origin. Port the client; note the CORS requirement for the backend team.

## File map (target)
| Path | Responsibility |
|------|----------------|
| `src/gen-quest/**` | Generated quest backend client (copied from source `src/gen`). |
| `kubb.config.quest.js` + `package.json` script `generate:quest` | Regeneration config (NEXT_PUBLIC_QUEST_API_URL). |
| `src/features/quest/context/*`, `lib/*`, `data/*`, `types.ts` | Quest infra (wallet reconciled to shared), campaign-mapper, mock/data, types. |
| `src/features/quest/components/{explore,campaigns,campaign-detail,profile,...}.tsx` | Reskinned quest UI. |
| `src/app/(quest)/quest/{page,campaigns/page,campaign/[id]/page,profile/page,visit/[taskId]/page}.tsx` | Native quest routes + `(quest)` layout (quest nav/footer reskinned). |
| `src/app/api/auth/{discord,telegram,x,callback/discord,callback/x}/route.ts` | Social OAuth (secrets server-side). |
| `src/shared/layout/sidebar-data.ts` (modify) | Point "Tasmil Quest" to `/quest` instead of the external URL. |
| `biome.json` (modify) | Add `src/gen-quest/**` to linter-disabled override. |
| `.env.example` / `.env.local` (modify) | Add `NEXT_PUBLIC_QUEST_API_URL` + OAuth env keys. |

---

### Task 1: gen-quest client
**Deliverable:** generated quest client present, imports resolve, build green.
- [ ] Copy `tasmil-quest-folder/frontend/src/gen` → `tasmil-finance/src/gen-quest` (183 files).
- [ ] Rewrite internal imports `@/gen/` → `@/gen-quest/` across the copied tree; if it imports a kubb client module (`@/lib/kubb-config` or similar), point at the app's `@/lib/kubb-backend-client` pattern OR copy the quest client base into `src/gen-quest/`. Keep `gen-quest` self-contained.
- [ ] Add `NEXT_PUBLIC_QUEST_API_URL` to `.env.example` and `.env.local` (default `http://localhost:5555`). Wire the gen-quest client base URL to it.
- [ ] Add `src/gen-quest/**` to the `biome.json` linter-disabled override.
- [ ] Add `kubb.config.quest.js` (adapted from source `kubb.config.ts`) + `generate:quest` script in package.json.
- [ ] `grep -rn "@/gen/" src/gen-quest` → nothing. `pnpm type-check` passes. `pnpm build` exits 0. Commit.

### Task 2: quest infra (context/stores/data/types) reconciled
**Deliverable:** quest support modules under `features/quest`, wallet/auth reconciled to shared.
- [ ] Copy quest `utils/campaign-mapper.ts`, `data/mock.ts`, `types/index.ts`, `constants/index.ts` into `src/features/quest/{lib,data}/` (+ `types.ts`). Rewrite `@/` imports.
- [ ] Do NOT port quest's `context/WalletContext.tsx` or `store/use-wallet.ts` verbatim. Instead, repoint quest components to the app's `@/shared/context/wallet-context` (`useWallet` exposes `address`, `connect`, `disconnect` - superset of quest's). Where quest reads `@/store/use-auth`, reconcile to the app's existing `@/store/use-auth`.
- [ ] `pnpm type-check` passes (quest components not yet imported by routes - forward errors OK). Commit.

### Task 3: reskin + port quest read components
**Deliverable:** Explore/Campaigns/CampaignDetail/Profile under `features/quest`, using `@/shared/ui/*`.
- [ ] Copy `Explore.tsx`, `Campaigns.tsx`, `CampaignDetail.tsx`, `Profile.tsx`, `Navbar.tsx`, `Footer.tsx`, `social/SocialConnectButtons.tsx`, `TelegramButton.tsx` into `src/features/quest/components/` (kebab-case to match feature convention where reasonable).
- [ ] Rewrite imports: `@/components/ui/<x>` → `@/shared/ui/<x>` (app has button, tabs, separator, input, dialog, card→card/glass-card, badge, avatar; map `card-v2` → `@/shared/ui/card` or `glass-card`, `typography` → `@/shared/ui/typography`). `@/gen/hooks` → `@/gen-quest/hooks`. `@/context/WalletContext` → `@/shared/context/wallet-context`. `@/utils/campaign-mapper` → `@/features/quest/lib/campaign-mapper`.
- [ ] Make minimal prop-API corrections for the target UI components (as in Phase 1: e.g. button `variant` vs boolean props).
- [ ] Update `features/quest/index.ts` barrel. `grep -rn "@/components/\|@/gen/\|@/context/" src/features/quest` → nothing. `pnpm type-check` passes. Commit.

### Task 4: mount native quest routes + relink sidebar
**Deliverable:** `/quest`, `/quest/campaigns`, `/quest/campaign/[id]`, `/quest/profile` render; sidebar points to `/quest`.
- [ ] Create `src/app/(quest)/layout.tsx` (quest chrome: reskinned Navbar/Footer + providers already in root). Create the route pages rendering the ported components. Keep existing `(dashboard)/quest` leaderboard reachable (e.g. `/quest/leaderboard` or keep current) - do not break it.
- [ ] Update `src/shared/layout/sidebar-data.ts`: "Tasmil Quest" url `https://quest.tasmil-finance.xyz` → `/quest`.
- [ ] `pnpm build` exits 0; routes appear in the build list. Add `e2e/quest.smoke.spec.ts` (quest routes render or auth-redirect, like the landing smoke). Commit.

### Task 5: visit/task flow + social OAuth routes
**Deliverable:** `/quest/visit/[taskId]` + `/api/auth/*` ported (compile; functional once env set).
- [ ] Copy `visit/[taskId]/page.tsx`; rewrite imports.
- [ ] Copy `src/app/api/auth/{discord,telegram,x,callback/discord,callback/x}/route.ts`; rewrite imports; confirm `@/lib/env` usage. Add OAuth env keys to `.env.example`.
- [ ] `pnpm type-check` + `pnpm build` pass. Commit. **PR note:** OAuth needs secrets + redirect-URI updates; gen-quest needs backend CORS.

### Task 6: verification gate + PR update
- [ ] `pnpm type-check` (0 errors), `pnpm build` (exit 0), `pnpm exec playwright test e2e/quest.smoke.spec.ts`.
- [ ] Confirm no new biome errors in non-generated quest files (reskinned components must be lint-clean, unlike the verbatim landing). Update PR #4 (or open a Phase-2 PR) into `deploy/staging` with the external-dependency notes.

## Self-Review
- Covers spec Phase-2 (quest read + write + OAuth) against actual staging state (leaderboard + admin already native).
- External deps (OAuth secrets, quest-backend CORS) flagged, not silently assumed.
- Reskin (quest → shared/ui) is real work with prop-API mismatches expected (Phase-1 precedent: button variant, input props).
- Risk: quest store/auth reconciliation; quest `gen` client base module path. Both surfaced by type-check per task.
