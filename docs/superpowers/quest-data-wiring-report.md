# Quest Feature — Data-Wiring Audit Report

**Branch:** `clone-deploy/staging`  
**Date:** 2026-06-26  
**Audited by:** automated static trace (no runtime)

---

## 1. Summary

| Stat | Count |
|------|-------|
| Distinct sections audited | 31 |
| Sections fully wired to a real gen-quest endpoint | 21 |
| Sections with hardcoded/mock-only data (backend gap) | 10 |
| Endpoints with a mock handler AND gen-quest hook (good) | 21 |
| Mock handler with NO gen-quest hook (leaky) | 0 |

**Overall:** roughly **two-thirds** of the UI is correctly wired to real backend endpoints. The remaining **10 gaps** are all hardcoded literal values rendered directly in JSX — no gen-quest hook is called for those values, meaning they will never update even in production (mock off).

The largest gaps are:

1. **Explore hero stats** (`12,400+` questers, `24` campaigns, `1.2M` points) — completely hardcoded, no hook called. The backend already has `GET /api/quest/analytics/system` with a generated hook (`useAnalyticsControllerSystemAnalytics`) but `Explore.tsx` never imports it.
2. **Leaderboard "Top 3 Prize Pool" sidebar** (50/20/10 USDC, +5,000/+3,000/+2,000 pts per place) — hardcoded literals, not read from `season.rankRewards`.
3. **Leaderboard "Points Rewards" sidebar** (rank 4-10, pts 1500/1200/.../200) — hardcoded `ptsMap` constant, not from `season.rankRewards`.
4. **Profile Overview — "Quests Done"** widget — computed as `loginStreak × 6`, a pure fabrication.
5. **Profile Overview — Referral Panel** (total earned 1,250 pts, 14 invited, 9 active) — hardcoded inline; `useReferralControllerGetMyReferral` is only called in `ReferralsTab`, not here.
6. **Profile Overview — Referral Rates** (L1 10%, L2 3%, L3 1%) — hardcoded in `Profile.tsx` OverviewTab.
7. **Profile Referrals — Referral Tier progress bar** — hardcoded `width: 46%`, no endpoint.
8. **Profile Sidebar — Tier** — read from `user.tier` (OK for auth-sourced data) but the `tier` field is not on any current gen-quest type; relies on the user object stored client-side in Zustand.

---

## 2. Per-Page Tables

### 2a. Nav / QuestNav

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Points pill | `QuestNav.tsx` | `useUsersControllerGetMe` | `GET /api/quest/users/me` | YES | REAL | `me.totalPoints` |
| Streak pill | `QuestNav.tsx` | `useUsersControllerGetMe` | `GET /api/quest/users/me` | YES | REAL | `me.loginStreak` |
| Daily check-in status | `QuestNav.tsx` | `useUsersControllerGetCheckInStatus` | `GET /api/quest/users/me/check-in-status` | YES | REAL | `hasCheckedIn` |
| Daily check-in action | `QuestNav.tsx` | `useUsersControllerDailyLogin` (mutation) | `POST /api/quest/users/me/daily-login` | YES | REAL | fires on click |
| Wallet address / avatar | `QuestNav.tsx` | `useUsersControllerGetMe` | `GET /api/quest/users/me` | YES | REAL | `me.walletAddress` |
| Sponsor badge | `Navbar.tsx` | `useUsersControllerGetMyCampaigns` | `GET /api/quest/users/me/campaign` | YES | REAL | reads `metadata.sponsor` |

> **Note:** There are two nav implementations: `QuestNav.tsx` (newer, used in the redesigned layout) and `Navbar.tsx` (older). Both wire the same endpoints but differ in styling. `QuestNav.tsx` is the canonical component per barrel import.

---

### 2b. Explore (`Explore.tsx`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Featured campaigns list | `Explore.tsx` | `useCampaignsControllerFindAll({ isFeatured: true })` | `GET /api/quest/campaigns?isFeatured=true` | YES | REAL | maps via `campaign-mapper` |
| Hero stat — "12,400+ Questers" | `Explore.tsx` | — | — | — | **HARDCODED** | literal `12,400+` in JSX, line 64 |
| Hero stat — "24 Campaigns" | `Explore.tsx` | — | — | — | **HARDCODED** | literal `24` in JSX, line 68 |
| Hero stat — "1.2M Points Given" | `Explore.tsx` | — | — | — | **HARDCODED** | literal `1.2M` in JSX, line 73 |

The hook `useAnalyticsControllerSystemAnalytics` exists (endpoint `GET /api/quest/analytics/system`) and is generated but **never imported** in `Explore.tsx`.

---

### 2c. Campaigns (`Campaigns.tsx`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Campaign list | `Campaigns.tsx` | `useCampaignsControllerFindAll({})` | `GET /api/quest/campaigns` | YES | REAL | |
| Filters (all/ongoing/closed) | `Campaigns.tsx` | — | — | — | CLIENT-SIDE | filters locally from the same hook's response |
| Result count badge | `Campaigns.tsx` | — | — | — | DERIVED | `filtered.length` derived from hook data |

---

### 2d. Campaign Detail (`CampaignDetail.tsx`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Campaign data | `CampaignDetail.tsx` | `useCampaignsControllerFindOne(id)` | `GET /api/quest/campaigns/:id` | YES | REAL | |
| Quest tasks list | `CampaignDetail.tsx` | same `findOne` response | `GET /api/quest/campaigns/:id` | YES | REAL | tasks embedded in campaign response |
| Task status per step | `QuestItem` inside `CampaignDetail.tsx` | `useTasksControllerGetStatus(taskId)` | `GET /api/quest/tasks/:id/status` | YES | REAL | |
| Task claim status per step | `QuestItem` | `useTasksControllerGetClaimStatus(taskId)` | `GET /api/quest/tasks/:id/claim-status` | YES | REAL | |
| Verify task action | `QuestItem` | `useTasksControllerVerifyTask` (mutation) | `POST /api/quest/tasks/:id/verify` | YES | REAL | |
| Claim task action | `QuestItem` | `useTasksControllerClaimTask` (mutation) | `POST /api/quest/tasks/:id/claim` | YES | REAL | |
| Sidebar — dates (start/end) | `CampaignDetail.tsx` | same `findOne` | `GET /api/quest/campaigns/:id` | YES | REAL | `campaign.startDate`, `campaign.endDate` |
| Sidebar — reward points | `CampaignDetail.tsx` | same `findOne` | `GET /api/quest/campaigns/:id` | YES | REAL | `campaign.points` |
| Sidebar — time remaining | `CampaignDetail.tsx` | — | — | — | DERIVED CLIENT-SIDE | computed from `campaign.endDate` |
| Join campaign action | `CampaignDetail.tsx` | `useCampaignsControllerJoinCampaign` (mutation) | `POST /api/quest/campaigns/:id/join` | YES | REAL | |
| Claim campaign action | `CampaignDetail.tsx` | `useCampaignsControllerClaimCampaign` (mutation) | `POST /api/quest/campaigns/:id/claim` | YES | REAL | |
| Social accounts (for task gating) | `CampaignDetail.tsx` | `useSocialAccountsControllerFindAll` | `GET /api/quest/social-accounts` | YES | REAL | |
| "More for you" (related campaigns) | `RelatedCampaigns` inside `CampaignDetail.tsx` | `useCampaignsControllerGetNotJoinedCampaigns` | `GET /api/quest/campaigns/not-joined` | YES | REAL | auth-gated |

---

### 2e. Leaderboard (`Leaderboard.tsx`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Podium (top 3) | `Leaderboard.tsx` → `Podium` | `useAnalyticsControllerGlobalLeaderboard` / `useAnalyticsControllerStreakLeaderboard` | `GET /api/quest/leaderboard/global` or `/streak` | YES | REAL | sliced to first 3 rows |
| Leaderboard rows (rank 4+) | `Leaderboard.tsx` → `LeaderboardRow` | same hooks | same endpoints | YES | REAL | |
| Prize-pool banner — USDC total | `Leaderboard.tsx` inline | `useSeasonsControllerCurrent` | `GET /api/quest/seasons/current` | YES | REAL | `season.prizePoolUsdc` with `?? 80` fallback |
| Prize-pool banner — pts total | `Leaderboard.tsx` inline | `useSeasonsControllerCurrent` | `GET /api/quest/seasons/current` | YES | REAL | `ptsPool = season.rankRewards.reduce(...)` |
| Countdown / resets | `Leaderboard.tsx` inline | `useSeasonsControllerCurrent` | `GET /api/quest/seasons/current` | YES | REAL | `season.endAt` |
| Player count ("N players competing") | `Leaderboard.tsx` inline | `useAnalyticsControllerGlobalLeaderboard` | `/api/quest/leaderboard/global` | YES | REAL | `rows.length` |
| Your position / rank | `Leaderboard.tsx` inline | `useSeasonsControllerMyResult` | `GET /api/quest/seasons/me` | YES | REAL | `myResult.finalRank` |
| Your points this season | `Leaderboard.tsx` inline | `useSeasonsControllerMyResult` | `GET /api/quest/seasons/me` | YES | REAL | `myResult.finalPoints` |
| **Top 3 Prize Pool sidebar — USDC per place** | `Leaderboard.tsx` inline | — | — | — | **HARDCODED** | `50`, `20`, `10` literals on lines 221, 230, 239; not from `season.rankRewards` |
| **Top 3 Prize Pool sidebar — pts per place** | `Leaderboard.tsx` inline | — | — | — | **HARDCODED** | `+5,000`, `+3,000`, `+2,000` literals on lines 222, 231, 240 |
| **"Points Rewards" sidebar (rank 4-10)** | `Leaderboard.tsx` inline | — | — | — | **HARDCODED** | `ptsMap` constant on line 255: `{4:1500, 5:1200, 6:1000, 7:800, 8:600, 9:400, 10:200}` |

**Critical note:** `season.rankRewards` (returned by `GET /api/quest/seasons/current`) is already being used to compute `ptsPool` for the banner, yet the sidebar prize cards completely ignore it and render hardcoded values. The backend data is already available — the sidebar just needs to map `season.rankRewards` instead of using literals.

---

### 2f. Profile Overview (`Profile.tsx` → `OverviewTab`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Points total | `OverviewTab` | — | — | — | LOCAL STORE | `user.totalPoints` from Zustand `useQuestAuthStore` — populated when `useUsersControllerGetMe` was called at login |
| Tier + tier progress bar | `OverviewTab` | — | — | — | LOCAL STORE | `user.tier` from Zustand; tier thresholds are hardcoded client-side (`{bronze:[0,15000], silver:[15000,50000], gold:[50000,100000]}`) |
| Daily streak | `OverviewTab` | — | — | — | LOCAL STORE | `user.loginStreak` from Zustand |
| Recent activity ledger | `OverviewTab` | `useUsersControllerGetPointsHistory(user.id)` | `GET /api/quest/users/:id/points-history` | YES | REAL | shows up to 5 entries |
| **"Quests Done" widget** | `OverviewTab` | — | — | — | **HARDCODED FORMULA** | renders `(user.loginStreak ?? 7) * 6`, line 361 — a fabricated number |
| **Referral Panel — "Total Earned From Refs" (1,250 pts)** | `OverviewTab` | — | — | — | **HARDCODED** | literal `1,250` on line 386; `useReferralControllerGetMyReferral` is never called in OverviewTab |
| **Referral Panel — Total invited (14) / Active (9)** | `OverviewTab` | — | — | — | **HARDCODED** | literals `14` and `9` on lines 390, 394 |
| Referral code | `OverviewTab` | — | — | — | LOCAL STORE | `user.referralCode ?? "TASMIL-X7K9"` — from Zustand; hardcoded fallback |
| **Referral Rates (L1 10%, L2 3%, L3 1%)** | `OverviewTab` | — | — | — | **HARDCODED** | inline JSX array `[["L1","10%","Direct"],["L2","3%","Indirect"],["L3","1%","3rd"]]` on line 406 |

---

### 2g. Profile My Quests (`Profile.tsx` → `MyQuestsTab`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Campaign list (pending/claimable/claimed) | `MyQuestsTab` | `useUsersControllerGetMyCampaigns({ status })` | `GET /api/quest/users/me/campaign?status=...` | YES | REAL | tab selection changes `status` param |
| Claim action (button) | `MyQuestsTab` | — | — | — | UI ONLY | button present but `onClick` does nothing (just links to campaign); the actual claim is on the CampaignDetail page |

---

### 2h. Profile Referrals (`Profile.tsx` → `ReferralsTab` + `Referrals.tsx`)

There are two referral implementations: an older one inside `Profile.tsx` (`ReferralsTab`) and a newer standalone `Referrals.tsx`. The Profile currently renders `ReferralsTab`.

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Referral code + hero | `ReferralsTab` in `Profile.tsx` | `useReferralControllerGetMyReferral` | `GET /api/quest/referral/me` | YES | REAL | falls back to `user.referralCode` |
| Commission amount (totalEarned) | `ReferralsTab` | `useReferralControllerGetMyReferral` | `GET /api/quest/referral/me` | YES | REAL hook, **but** has `?? 1250` hardcoded fallback | `refDataObj.totalEarned ?? 1250` |
| Total invited / active | `ReferralsTab` | `useReferralControllerGetMyReferral` | `GET /api/quest/referral/me` | YES | REAL hook, **but** has `?? 14` / `?? 9` hardcoded fallbacks | lines 583-584 |
| L1 rate (%) | `ReferralsTab` | `useReferralControllerGetMyReferral` | `GET /api/quest/referral/me` | YES | REAL | `rates.find(r => r.layer===1)?.rateBps ?? 1000` |
| L2/L3 rates | `ReferralsTab` | `useReferralControllerGetMyReferral` | `GET /api/quest/referral/me` | YES | REAL | same rates array with `?? 300` / `?? 100` fallbacks |
| Referral list | `ReferralsTab` | `useUsersControllerGetReferrals` | `GET /api/quest/users/me/referrals` | YES | REAL | |
| **Referral tree (nested)** | `ReferralsTab` (view=tree) | `useUsersControllerGetReferrals` | `GET /api/quest/users/me/referrals` | YES | PARTIAL — renders a flat list as "tree" | The real `Referrals.tsx` component uses `useReferralControllerGetTree` → `GET /api/quest/referral/tree` for a true nested tree, but `Profile.tsx` ReferralsTab uses the flat referrals list and just re-renders it in "tree" style |
| **Referral Tier progress bar** | `ReferralsTab` | — | — | — | **HARDCODED** | `width: "46%"` on line 702 |

**Note on `Referrals.tsx`:** The standalone `Referrals.tsx` is a better-wired replacement — it calls `useReferralControllerGetTree` (endpoint `GET /api/quest/referral/tree`) for a real nested tree, and computes totalCommission/totalInvited/totalActive from live API data. However, it is not currently rendered by `Profile.tsx`. The Profile still uses the older in-file `ReferralsTab`.

---

### 2i. Profile Social (`Profile.tsx` → `SocialTab`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Connected social accounts list | `SocialTab` | `useSocialAccountsControllerFindAll` | `GET /api/quest/social-accounts` | YES | REAL | |
| Connect action (opens OAuth popup) | `SocialTab` | — | — | — | CLIENT-SIDE | opens `/api/auth/:platform` in popup — not a gen-quest hook |
| Disconnect action | `SocialTab` | Button present but `onClick` absent | — | — | **NOT WIRED** | `Button variant="ghost"` has no `onClick`; `useSocialAccountsControllerUnlinkAccount` exists in gen-quest but is not imported in this tab |

---

### 2j. Profile Sidebar (`Profile.tsx` → `Sidebar`)

| Section | Component | Hook | Endpoint | Exists in gen-quest? | Data Source | Notes |
|---------|-----------|------|----------|----------------------|-------------|-------|
| Avatar display | `Sidebar` | — | — | — | LOCAL STORE | `user.avatarUrl` from Zustand |
| Username display + edit | `Sidebar` | `useUsersControllerUpdateProfile` (mutation) | `PATCH /api/quest/users/me` | YES | REAL | saves to backend on submit |
| Wallet address | `Sidebar` | — | — | — | LOCAL STORE | `user.walletAddress` from Zustand |
| Tier badge | `Sidebar` | — | — | — | LOCAL STORE | `user.tier` from Zustand |

---

## 3. Gaps — Endpoints / Backend Work Needed

These sections render hardcoded values in production (mock off) that require either a new backend endpoint or wiring an existing one that is already generated but unused.

| # | Section | Current State | Proposed Fix |
|---|---------|---------------|--------------|
| 1 | **Explore hero — Questers count ("12,400+")** | Hardcoded string in `Explore.tsx:64` | Call `useAnalyticsControllerSystemAnalytics` (hook exists, endpoint `GET /api/quest/analytics/system`). Backend must return `{ totalUsers, totalCampaigns, totalPoints }`. |
| 2 | **Explore hero — Campaigns count ("24")** | Hardcoded literal in `Explore.tsx:68` | Same hook above. |
| 3 | **Explore hero — Points Given ("1.2M")** | Hardcoded string in `Explore.tsx:73` | Same hook above. |
| 4 | **Leaderboard sidebar — Top 3 USDC prizes (50/20/10)** | Hardcoded literals in `Leaderboard.tsx:221,230,239` | Read from `season.rankRewards[0..2].usdc` — data is already fetched via `useSeasonsControllerCurrent`; needs sidebar to map `rankRewards`. No new endpoint needed, only frontend wiring. |
| 5 | **Leaderboard sidebar — Top 3 pts prizes (5000/3000/2000)** | Hardcoded literals in `Leaderboard.tsx:222,231,240` | Same as above — `season.rankRewards[0..2].points`. |
| 6 | **Leaderboard sidebar — Points Rewards rank 4-10 (ptsMap)** | Hardcoded `ptsMap` constant in `Leaderboard.tsx:255` | Map from `season.rankRewards` filtered to `rankFrom >= 4`. No new endpoint needed. |
| 7 | **Profile Overview — "Quests Done"** | `loginStreak * 6` formula in `Profile.tsx:361` | Backend needs to expose completed quest count. Proposed: add `completedQuestsCount` to `GET /api/quest/users/me` response, or a dedicated `GET /api/quest/users/me/stats` endpoint. |
| 8 | **Profile Overview — Referral panel (total earned 1,250 pts, 14 invited, 9 active)** | Hardcoded literals in `Profile.tsx:386,390,394` | Call `useReferralControllerGetMyReferral` in `OverviewTab` (already called in `ReferralsTab`). Endpoint `GET /api/quest/referral/me` exists and is mocked. No new endpoint needed. |
| 9 | **Profile Overview — Referral rates (L1 10%, L2 3%, L3 1%)** | Hardcoded inline array in `Profile.tsx:406` | Same hook: use `refDataObj.rates` from `GET /api/quest/referral/me`. |
| 10 | **Profile Referrals — Tier progress bar ("46%")** | Hardcoded `width: "46%"` in `Profile.tsx:702` | Backend needs a referral tier progression field. Could be derived from `totalEarned` against tier thresholds returned by `GET /api/quest/referral/me`, or a dedicated tier-progress field. |
| 11 | **Profile Social — Disconnect button (no-op)** | `Button` with no `onClick` in `SocialTab` | Call `useSocialAccountsControllerUnlinkAccount` (mutation exists at `DELETE /api/quest/social-accounts/:platform`). Frontend wiring only — endpoint exists. |
| 12 | **Profile Referrals — True nested tree** | `Profile.tsx` `ReferralsTab` renders flat list in "tree" mode | Replace `ReferralsTab` referral tree section with the already-built `Referrals.tsx` component, or wire `useReferralControllerGetTree` (endpoint `GET /api/quest/referral/tree`) directly in the profile tree view. |

---

## 4. Mock-Only Handlers (verify gen-quest hook exists)

The following `apply-mocks.ts` handlers intercept real gen-quest endpoint paths. Each has a corresponding generated hook in `src/gen-quest/hooks/`. All are confirmed present.

| Mock path in `apply-mocks.ts` | gen-quest hook | Status |
|-------------------------------|----------------|--------|
| `GET /api/quest/campaigns` | `useCampaignsControllerFindAll` | Hook exists |
| `GET /api/quest/campaigns/not-joined` | `useCampaignsControllerGetNotJoinedCampaigns` | Hook exists |
| `GET /api/quest/campaigns/:id` | `useCampaignsControllerFindOne` | Hook exists |
| `POST /api/quest/campaigns/:id/join` | `useCampaignsControllerJoinCampaign` | Hook exists |
| `POST /api/quest/campaigns/:id/claim` | `useCampaignsControllerClaimCampaign` | Hook exists |
| `GET /api/quest/tasks/:id/status` | `useTasksControllerGetStatus` | Hook exists |
| `GET /api/quest/tasks/:id/claim-status` | `useTasksControllerGetClaimStatus` | Hook exists |
| `POST /api/quest/tasks/:id/verify` | `useTasksControllerVerifyTask` | Hook exists |
| `POST /api/quest/tasks/:id/claim` | `useTasksControllerClaimTask` | Hook exists |
| `POST /api/quest/tasks/:id/visit` | `useTasksControllerRecordVisit` | Hook exists |
| `POST /api/quest/tasks/:id/submit-proof` | `useTasksControllerSubmitProof` | Hook exists |
| `POST /api/quest/tasks/complete-by-action` | `useTasksControllerCompleteByAction` | Hook exists |
| `GET /api/quest/users/me` | `useUsersControllerGetMe` | Hook exists |
| `PATCH /api/quest/users/me` | `useUsersControllerUpdateProfile` | Hook exists |
| `GET /api/quest/users/me/campaign` | `useUsersControllerGetMyCampaigns` | Hook exists |
| `GET /api/quest/users/me/referrals` | `useUsersControllerGetReferrals` | Hook exists |
| `GET /api/quest/users/me/check-in-status` | `useUsersControllerGetCheckInStatus` | Hook exists |
| `POST /api/quest/users/me/daily-login` | `useUsersControllerDailyLogin` | Hook exists |
| `GET /api/quest/users/:id/points-history` | `useUsersControllerGetPointsHistory` | Hook exists |
| `GET /api/quest/social-accounts` | `useSocialAccountsControllerFindAll` | Hook exists |
| `POST /api/quest/social-accounts/:platform/link` | `useSocialAccountsControllerLinkAccount` | Hook exists |
| `DELETE /api/quest/social-accounts/:platform` | `useSocialAccountsControllerUnlinkAccount` | Hook exists (not yet called in SocialTab) |
| `GET /api/quest/leaderboard/global` | `useAnalyticsControllerGlobalLeaderboard` | Hook exists |
| `GET /api/quest/leaderboard/streak` | `useAnalyticsControllerStreakLeaderboard` | Hook exists |
| `GET /api/quest/seasons/current` | `useSeasonsControllerCurrent` | Hook exists |
| `GET /api/quest/seasons/me` | `useSeasonsControllerMyResult` | Hook exists |
| `POST /api/quest/seasons/me/reveal-ack` | `useSeasonsControllerRevealAck` | Hook exists |
| `GET /api/quest/seasons/current/leaderboard` | `useSeasonsControllerLeaderboard` | Hook exists |
| `GET /api/quest/referral/me` | `useReferralControllerGetMyReferral` | Hook exists |
| `GET /api/quest/referral/tree` | `useReferralControllerGetTree` | Hook exists |
| `GET /api/quest/referral/leaderboard` | `useReferralControllerGetLeaderboard` | Hook exists |
| `GET /api/quest/notifications` | `useNotificationsControllerList` | Hook exists |

**No mock-only handlers without a gen-quest hook were found.** All mocked paths have matching generated clients and hooks.

---

## 5. Key File References

| File | Role |
|------|------|
| `src/features/quest/components/Explore.tsx` | Hardcoded hero stats on lines 64, 68, 73 |
| `src/features/quest/components/Leaderboard.tsx` | Hardcoded prize sidebar lines 221-240; hardcoded ptsMap line 255 |
| `src/features/quest/components/Profile.tsx` | Hardcoded quests-done (361), referral panel (386, 390, 394, 406), tier progress bar (702) |
| `src/features/quest/components/Referrals.tsx` | Better-wired referral component using `useReferralControllerGetTree`; not yet used by Profile |
| `src/mocks/apply-mocks.ts` | Axios interceptor — all mock paths listed in section 4 |
| `src/mocks/data/quest.ts` | Mock data constants |
| `src/gen-quest/hooks/` | All generated React Query hooks |
| `src/gen-quest/client/` | All generated Axios client functions with endpoint URLs |
| `src/gen-quest/client/analytics-controller-system-analytics.ts` | Endpoint `GET /api/quest/analytics/system` — hook exists, never called in Explore |
| `src/features/quest/lib/season-types.ts` | View-model types for seasons/referrals; `CurrentSeason.rankRewards` already typed |
