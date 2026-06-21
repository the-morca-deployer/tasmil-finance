# Quest new-ui Port + Backend Gap-Check + Seed/Playwright Verification — Design

**Date:** 2026-06-21
**Repos touched:** `tasmil-finance` (frontend), `tasmil-quest-backend` (seed + dev-login)
**Status:** Approved design → ready for implementation plan

---

## 1. Goal

Three outcomes, in one coordinated effort:

1. **Port UI** — replace the current Quest UI inside `tasmil-finance` with the look of
   `tasmil-quest-frontend@origin/new-ui`, screen-for-screen, pixel-faithful to the supplied
   reference screenshots. Also surface quest data on shared app surfaces: point/streak badges in
   the `/chat` header, a sponsor badge in the quest header, and rank/top%/tier/points in the shared
   wallet dropdown.
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
- **Scope:** all screens — Explore, Campaigns, Campaign detail, Leaderboard, Profile (all tabs) —
  plus the cross-surface additions: `/chat` header point+streak badges (with check-in), quest
  header sponsor badge (when joined a sponsored campaign), and rank/top%/tier/points in the shared
  wallet dropdown.
- **Pixel-perfect approach:** port CSS + markup 1:1 (pixel-perfect by construction), then verify
  each screen against the reference screenshots in `tmp/images-quest/` (manual side-by-side, no
  automated threshold gating).
- **Seed scope:** full dataset (test user + supporting users, season + leaderboard + rewards,
  campaigns with all task types, participations/claims, socials, notifications, referrals).
- **D1 — dev auth:** add `POST /auth/dev-login` to the quest backend, guarded by
  `NODE_ENV !== 'production'` **and** `QUEST_DEV_LOGIN=true`, minting a real JWT for a seeded test
  user. The frontend dev-bypass calls it on quest mount so authenticated screens load seeded data.
- **TDD:** all behavioral production code is written test-first (RED → GREEN → REFACTOR). Visual
  fidelity (CSS/markup pixel match) is not unit-testable and is verified by screenshot comparison
  against the reference images — this is an explicit, agreed boundary, not a skipped test.

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

## 5. Architecture, workstreams & TDD

### TDD methodology

The Iron Law: **no behavioral production code without a failing test first.** Every unit follows
RED (write one failing test) → verify it fails for the right reason → GREEN (minimal code to pass)
→ REFACTOR (clean up, stay green).

**What is TDD'd (test-first, mandatory):**
- Backend logic — `POST /auth/dev-login` (guard behavior, token minting).
- Seed invariants — after `prisma db seed`, asserted dataset shape.
- Frontend behavior — component data rendering, conditional states, tab switching, internal link
  targets, newly-wired endpoints from the gap-check.
- Cross-screen flows — join/claim/daily-login/link-unlink/reveal-ack.

**Test layers (fast inner loop first):**
- Jest + React Testing Library (`pnpm test`) — component behavior, the primary inner loop for
  Workstream A. Watch each fail before porting the component.
- NestJS Jest (`pnpm test` / `test:e2e` in quest backend) — dev-login and seed invariants.
- Playwright (`pnpm test:e2e`) — cross-screen logic flows (written test-first against expected
  seeded data) and screenshot capture.

**What is NOT TDD'd (verified by screenshot, agreed boundary):**
- Pixel/CSS fidelity. We assert *behavior* with tests and *appearance* with side-by-side
  screenshot review against `tmp/images-quest/`. A component test checks "renders the campaign
  title and a `/quest/campaign/:id` link"; the screenshot check confirms it *looks* like the
  reference. The two are complementary, not a substitute for each other.

**Order within every workstream below:** write the failing test(s) first, watch them fail, then
write the implementation step(s) that turn them green.

### Workstream A — Port the new-ui look (tasmil-finance)

**Tests first (RED).** For each screen/component, before porting, write failing Jest/RTL tests
for its behavior: correct seeded data renders, internal links target `/quest/*` (not root),
conditional states resolve (e.g. QuestStep locked/active/done, Pending/Claimable/Claimed tabs,
Points/Streak toggle, podium ordering 2/1/3). Watch them fail against the current/absent
component. Then port internals (A1–A4) as the minimal GREEN to satisfy them; refactor while green.
Pixel fidelity is checked separately via screenshot after the component is green.

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

**A5. Cross-surface badges & wallet dropdown.** Quest data now appears on shared surfaces. The
shared components (`src/shared/layout/top-nav-bar.tsx`, `src/shared/components/connect-wallet-button.tsx`)
must stay feature-agnostic — `shared` never imports `@/features/quest`. Instead, quest data is read
at the composition layer (the dashboard layout / a thin quest-aware wrapper) and passed **into the
shared components via props/slots**.

- **A5a. `/chat` header badges.** Add a point badge and a streak badge to `TopNavBar` (the `/chat`
  header), mirroring the quest header. Shown only when the connected user has a quest profile (data
  via `gen-quest` `users/me`); hidden otherwise. The streak badge triggers daily check-in
  (`users/me/daily-login`) exactly like the quest `Navbar`, with the same invalidate/refetch and
  success toast. *Tests first (RED):* badge renders when a quest profile exists; badge absent when
  it does not; clicking the streak badge fires the check-in mutation and reflects the new streak.
- **A5b. Quest header sponsor badge.** Add a sponsor badge to the quest header, shown when the user
  has joined a sponsored campaign (sponsor metadata from the joined-campaign data). *Tests first
  (RED):* badge renders with the sponsor name when a joined campaign has a sponsor; absent when no
  joined campaign is sponsored.
- **A5c. Wallet dropdown rank info.** Extend the shared `ConnectWalletButton` dropdown (used in
  both the chat/app topbar and elsewhere) to show the user's season rank, top-percentile, tier, and
  total points (e.g. `#34 · top 92% · Bronze · 10 pts`), sourced from `seasons/me` (rank) +
  `users/me` (tier/points) and passed in via props. *Tests first (RED):* dropdown renders rank,
  top%, tier, and points when quest data is provided; falls back gracefully (rank row hidden) when
  the user has no season result yet.

**Constraints:** feature isolation (no cross-feature imports — use `src/shared/` or props),
Biome conventions (2-space, double quotes, line width 100, `import type`, no `any`, no
`console.log`), English-only strings. Import quest symbols from the feature barrel.

### Workstream B — Backend ↔ FE gap-check (tasmil-finance)

The diff/checklist itself is analysis (no production code). But every endpoint we decide to
**wire** is production code → test-first: write a failing component/flow test asserting the new
data renders (e.g. "My Quests tab lists the seeded joined campaign", "ledger shows points
history rows", "Disconnect unlinks a social account"), watch it fail, then add the wiring as GREEN.

- Diff generated hooks in `src/gen-quest/` against hooks actually consumed by quest components.
- Known unwired user-facing endpoints to evaluate: `users/me/campaign` (My Quests),
  `users/:id/points-history` (ledger), `social/unlink`, `referral/me` (commission rates),
  `referral/leaderboard`, `notifications/list`, `tasks/submit-proof`, `tasks/complete-by-action`,
  analytics `streak-leaderboard`.
- Rule: if a new-ui screen covers the endpoint, wire it during the port (My Quests, ledger,
  social unlink, streak toggle close several automatically); otherwise record it in a
  `docs/quest-backend-fe-gap.md` checklist with a reason (backlog vs intentionally unused).

### Workstream C — Seed + dev-login + Playwright (tasmil-quest-backend + tasmil-finance)

**C1. Seed (full).** Test-first: write a failing seed-invariant test (Jest, runs after
`prisma db seed` against a test DB) asserting the dataset shape — the primary test user exists with
the expected points/streak/referralCode, N campaigns with varied task types, an ACTIVE season with
a non-empty leaderboard and rank rewards, ≥1 referral commission row. Watch it fail, then write the
seed to satisfy it. Expand `tasmil-quest-backend/prisma/seed.ts` with idempotent upserts (data
only — no schema change, so no migration needed; the existing `QuestReferralConfig` 3-layer seed
is preserved):
- 1 primary test user (known wallet/username, points/streak/tier/referralCode) plus a handful of
  supporting users so podium/leaderboard/referral tree render realistically.
- 1 ACTIVE season + rank rewards + season results/leaderboard.
- Multiple campaigns, each with varied task types (X_FOLLOW, X_RETWEET, BROWSE, ONCHAIN,
  TELEGRAM_JOIN), plus participations and some completed/claimed tasks.
- Social accounts, notifications, referral events/commissions.

**C2. Dev-login (D1).** Test-first: write failing NestJS e2e tests before the handler exists —
(a) with `QUEST_DEV_LOGIN=true` + non-prod, `POST /auth/dev-login` returns a valid access JWT that
the JWT guard accepts on a protected route; (b) with the flag unset, it returns 404/403; (c) it is
never mounted when `NODE_ENV==='production'`. Watch them fail, then implement the handler as GREEN.
Add `POST /auth/dev-login` to the quest backend:
- Guarded by `NODE_ENV !== 'production'` **and** `QUEST_DEV_LOGIN=true` (both required; never
  active in production — consistent with the platform's mainnet boot-guard posture).
- Accepts the test user's wallet/username, mints a real access JWT via the existing signing path.
- Frontend: when `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`, the quest surface calls `dev-login` on mount
  to obtain a valid quest token, so authenticated screens load seeded data for both manual
  browsing and Playwright.

**C3. Playwright (tasmil-finance/e2e).** The logic specs are themselves the test-first artifacts
for cross-screen flows: written to assert the expected seeded behavior, they fail (RED) until the
corresponding Workstream A/B implementation lands (GREEN). Screenshot specs are capture-only.
- Setup: quest backend (seeded) + finance dev server with `DEV_BYPASS=true` + dev-login.
- Logic specs per screen: assert seeded data renders (campaign counts, detail task lists, podium
  names, profile points/streak/referrals/socials) and key flows work (join campaign, claim task,
  daily-login, link/unlink social, season reveal-ack).
- Pixel specs: screenshot each screen and store it next to the matching reference image from
  `tmp/images-quest/` for manual side-by-side review (no threshold gating).

## 6. Sequencing (test-first throughout)

1. **C2 dev-login** — RED (failing e2e for guard + token) → GREEN (handler). Unlocks authenticated
   access for everything after it.
2. **C1 seed** — RED (failing seed-invariant test) → GREEN (seed script). Provides the data the
   later RED tests assert against.
3. **A — port UI screen by screen** (Explore → Campaigns → Detail → Leaderboard → Profile). Per
   component: RED (Jest/RTL behavior test) → GREEN (port internals) → REFACTOR → screenshot-compare
   against its reference image. B's wiring is folded in here, test-first, as each screen needs it.
4. **B — finalize the gap checklist** — confirm what the port closed; record the remainder with
   reasons. Any still-wired endpoint follows the same RED → GREEN.
5. **C3 — Playwright suite** — flesh out the cross-screen logic specs (RED before their screens are
   done, GREEN after) and screenshot captures. Ensure `pnpm test` and `pnpm build` pass before any
   push.

Each step's tests must be watched failing before its implementation is written; no behavioral code
lands without a test that failed first.

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
- **Seed-invariant test needs an isolated test DB** — run against a disposable/ephemeral database
  so the assertion is deterministic and never touches shared data.
- **Visual fidelity has no automated gate** (by design) — mitigated by mandatory per-screen
  screenshot review against the reference images before a screen is considered done.
- **Shared ↔ feature coupling** for the cross-surface badges — mitigated by the props/slot pattern
  (A5): `shared` stays feature-agnostic; quest data is injected at the composition layer, never
  imported into `src/shared/`.
- **Badges depend on quest data being reachable from the chat/app context** — under dev-bypass this
  requires dev-login + seed (C1/C2); in production it requires the user to have a quest profile,
  which A5a/A5c already gate on (hidden/fallback when absent).
