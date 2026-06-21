# Quest new-ui Port + Backend Gap-Check + Seed/Playwright Verification — Design

**Date:** 2026-06-21
**Repos touched:** `tasmil-finance` (frontend), `tasmil-quest-backend` (seed + dev-login)
**Status:** Approved design → ready for implementation plan

---

## 1. Goal

Three outcomes, in one coordinated effort:

1. **Port UI** — replace the current Quest UI inside `tasmil-finance` with the look of
   `tasmil-quest-frontend@origin/new-ui`, screen-for-screen, pixel-faithful to the supplied
   reference screenshots.
2. **Gap-check** — verify which `tasmil-quest-backend` endpoints are not yet wired to the
   frontend, and close the gaps that the new-ui screens cover.
3. **Seed + verify** — expand the quest backend seed to a full dataset, add a guarded
   dev-login so authenticated screens render seeded data under dev-bypass, and build a
   Playwright suite that checks quest logic + captures screenshots for pixel comparison
   against the reference images.

## 2. Context & key findings

`tasmil-finance` is now the single monolith (landing + main app + quest merged). Quest lives
at `src/features/quest/` with routes under `src/app/(quest)/` serving `/quest/*`.
`tasmil-quest-frontend@new-ui` is the **design source only** — its look is ported in, not deployed.

Both sides already share the same architecture, which makes this a **UI port**, not a
re-integration:

| Aspect | tasmil-finance (current) | quest-frontend@new-ui (source) |
|---|---|---|
| Routes | `(quest)` group → `/quest`, `/quest/campaigns`, `/quest/campaign/:id`, `/quest/leaderboard`, `/quest/profile`, `/quest/visit/:id` | root → `/`, `/campaigns`, `/campaign/:id`, `/leaderboard`, `/profile`, `/visit/:id` |
| Backend client | `src/gen-quest/` (Kubb, 56 ops, `NEXT_PUBLIC_QUEST_API_URL` + `/api-json`) | `src/gen/` (Kubb, same controllers, `NEXT_PUBLIC_API_URL` + `/docs-json`) |
| Auth / wallet | `use-quest-auth` + `wallet-context` wired into the app-wide wallet store | own `WalletContext` + `use-auth` |
| Design tokens | `quest.css` scoped to `.quest-scope`, cyan `#67E8F9` | `globals.css @theme` + `quest.css`, same cyan `#67E8F9` |
| Components | all pages exist, some legacy: `leaderboard-table`, `season-podium`, `podium-card` | refreshed: `Podium` (3D), `LeaderboardRow`, `RankMove`, `StatRing`, `LedgerRow`, `QuestStep`, `CampaignCard`, `Rise` (framer-motion), `TFLoader` |

- `framer-motion@^12` is already a dependency in `tasmil-finance` (needed for `Rise`).
- The quest backend validates real HS256 JWTs and has **no dev bypass**. The frontend
  dev-bypass mints a fake `"dev-bypass-token"` that the quest backend rejects, so under
  dev-bypass only public screens (campaigns, leaderboard) load — authenticated screens 401.
  This is the gap Workstream C / Decision D1 closes.

## 3. Decisions (locked)

- **Target architecture:** port the new-ui look into `tasmil-finance/src/features/quest/`. Quest
  stays part of the monolith, reusing its auth/wallet/layout. The standalone repo is reference only.
- **Scope:** all screens — Explore, Campaigns, Campaign detail, Leaderboard, Profile (all tabs).
- **Pixel-perfect approach:** port CSS + markup 1:1 (pixel-perfect by construction), then verify
  each screen against the reference screenshots in `tmp/images-quest/` (manual side-by-side, no
  automated threshold gating).
- **Seed scope:** full dataset (test user + supporting users, season + leaderboard + rewards,
  campaigns with all task types, participations/claims, socials, notifications, referrals).
- **D1 — dev auth:** add `POST /auth/dev-login` to the quest backend, guarded by
  `NODE_ENV !== 'production'` **and** `QUEST_DEV_LOGIN=true`, minting a real JWT for a seeded test
  user. The frontend dev-bypass calls it on quest mount so authenticated screens load seeded data.

## 4. Pixel reference

13 unique reference screens live in `tmp/images-quest/` (2 duplicate pairs removed). Each screen
maps to one or more reference images and must match them on layout, spacing, color, and copy:

| Screen | Reference image(s) |
|---|---|
| Explore (hero + feature cards + Featured campaigns) | `18.22.17`, `18.22.34` |
| Campaigns (search + All/Ongoing/Closed filter + grid) | `18.23.07` |
| Campaign detail (QuestStep list, reward sidebar, More-for-you) | `18.22.41` |
| Leaderboard — podium hero (3D 2/1/3) | `18.22.17` |
| Leaderboard — position + countdown + rows | `18.21.13` |
| Leaderboard — Points list + Top 3 Prize Pool + Points Rewards | `18.21.24` |
| Leaderboard — Streak toggle | `18.22.01` |
| Profile › Overview (points, tier ladder, streak, quests done) | `18.21.01` |
| Profile › My Quests (Pending/Claimable/Claimed) | `18.20.28` |
| Profile › Referrals (program, My Earnings, L1/L2/L3, list/tree) | `18.19.58`, `18.20.38` |
| Profile › Social Accounts (Discord/X/Telegram) | `18.21.48` |

Header reads **"Tasmil Quest"** with nav `Explore / Campaigns / Leaderboard / Profile`; in the
port these links route to `/quest/*` instead of root.

## 5. Architecture & workstreams

### Workstream A — Port the new-ui look (tasmil-finance)

**A1. Design tokens.** Reconcile new-ui `@theme` token names (`--color-accent`…) with the
finance `.quest-scope` tokens (`--accent`…). Keep everything scoped to `.quest-scope` so the
quest theme never leaks into the rest of the monolith. Color values already match.

**A2. quest.css.** Port the new-ui component classes 1:1 (`.page`, `.camp-grid`, `.camp-card`,
`.x-hero`, `.qs-row`, `.podium`, `.row`, `.social-card`, `.stat-ring`, `.ledger-row`,
`.referral-table`, `@keyframes rgbsplit`) into `src/features/quest/quest.css` under `.quest-scope`.

**A3. Components — swap internals, keep the finance data layer.**
- Add from new-ui: `Podium`, `LeaderboardRow`, `RankMove`, `StatRing`, `LedgerRow`, `QuestStep`,
  `Rise`, refreshed `CampaignCard`, refreshed `Navbar`/`Footer`/`TFLoader`.
- Rewire each ported component: imports `src/gen` → `@/gen-quest`; new-ui `WalletContext`/`use-auth`
  → finance `wallet-context`/`use-quest-auth`.
- Retire legacy: `leaderboard-table` → `Podium` + `LeaderboardRow`; `season-podium`/`podium-card`
  → `Podium`; rebuild `Profile` internals into tabs Overview/Quests/Referrals/Socials using
  `StatRing`/`LedgerRow`/`SocialConnectCard`.

**A4. Routing.** Keep the finance `(quest)` route paths. Rewrite every internal link in the
ported components (Navbar, cards, CTAs, footer) from root paths to `/quest/*`.

**Constraints:** feature isolation (no cross-feature imports — use `src/shared/` or props),
Biome conventions (2-space, double quotes, line width 100, `import type`, no `any`, no
`console.log`), English-only strings. Import quest symbols from the feature barrel.

### Workstream B — Backend ↔ FE gap-check (tasmil-finance)

- Diff generated hooks in `src/gen-quest/` against hooks actually consumed by quest components.
- Known unwired user-facing endpoints to evaluate: `users/me/campaign` (My Quests),
  `users/:id/points-history` (ledger), `social/unlink`, `referral/me` (commission rates),
  `referral/leaderboard`, `notifications/list`, `tasks/submit-proof`, `tasks/complete-by-action`,
  analytics `streak-leaderboard`.
- Rule: if a new-ui screen covers the endpoint, wire it during the port (My Quests, ledger,
  social unlink, streak toggle close several automatically); otherwise record it in a
  `docs/quest-backend-fe-gap.md` checklist with a reason (backlog vs intentionally unused).

### Workstream C — Seed + dev-login + Playwright (tasmil-quest-backend + tasmil-finance)

**C1. Seed (full).** Expand `tasmil-quest-backend/prisma/seed.ts` with idempotent upserts (data
only — no schema change, so no migration needed; the existing `QuestReferralConfig` 3-layer seed
is preserved):
- 1 primary test user (known wallet/username, points/streak/tier/referralCode) plus a handful of
  supporting users so podium/leaderboard/referral tree render realistically.
- 1 ACTIVE season + rank rewards + season results/leaderboard.
- Multiple campaigns, each with varied task types (X_FOLLOW, X_RETWEET, BROWSE, ONCHAIN,
  TELEGRAM_JOIN), plus participations and some completed/claimed tasks.
- Social accounts, notifications, referral events/commissions.

**C2. Dev-login (D1).** Add `POST /auth/dev-login` to the quest backend:
- Guarded by `NODE_ENV !== 'production'` **and** `QUEST_DEV_LOGIN=true` (both required; never
  active in production — consistent with the platform's mainnet boot-guard posture).
- Accepts the test user's wallet/username, mints a real access JWT via the existing signing path.
- Frontend: when `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`, the quest surface calls `dev-login` on mount
  to obtain a valid quest token, so authenticated screens load seeded data for both manual
  browsing and Playwright.

**C3. Playwright (tasmil-finance/e2e).**
- Setup: quest backend (seeded) + finance dev server with `DEV_BYPASS=true` + dev-login.
- Logic specs per screen: assert seeded data renders (campaign counts, detail task lists, podium
  names, profile points/streak/referrals/socials) and key flows work (join campaign, claim task,
  daily-login, link/unlink social, season reveal-ack).
- Pixel specs: screenshot each screen and store it next to the matching reference image from
  `tmp/images-quest/` for manual side-by-side review (no threshold gating).

## 6. Sequencing

1. **C1 + C2** — seed + dev-login (unlocks real data for both building and testing).
2. **A** — port UI screen by screen (Explore → Campaigns → Detail → Leaderboard → Profile),
   comparing each against its reference image immediately.
3. **B** — finalize the gap checklist (mostly closed by the port).
4. **C3** — complete the Playwright suite; ensure `pnpm build` passes before any push.

## 7. Branches & workflow

- Branch from `origin/deploy/staging` in each repo.
- `tasmil-finance`: `feat/quest-new-ui-port`.
- `tasmil-quest-backend`: `feat/quest-seed-dev-login`.
- PR into `deploy/staging`; never push `deploy/prod`. Run `pnpm build` (frontend) and confirm
  exit 0 before pushing. English-only in all source.

## 8. Out of scope

- Admin quest UI (`/admin/quests`, `/admin/quest-campaigns`) — not part of the new-ui port.
- Backend feature work beyond seed + dev-login (all quest features already merged to staging).
- Automated visual-regression threshold gating (explicitly deferred per pixel approach).
- Production deployment.

## 9. Risks

- **Token-name drift** between new-ui `@theme` and finance `.quest-scope` could cause subtle color
  mismatches — mitigated by an explicit 1:1 token mapping in A1.
- **Internal links** silently pointing to root paths instead of `/quest/*` — caught by Playwright
  navigation specs.
- **Dev-login leaking to production** — mitigated by the dual `NODE_ENV` + `QUEST_DEV_LOGIN` guard
  and a boot assertion.
- **Font/animation flakiness** in screenshots — avoided by not gating on pixel thresholds.
