# Quest Backend ↔ Frontend Endpoint Gap Checklist

> Generated after Plans 2–3 (`feat/quest-cross-surface`).  
> Scope: quest backend controllers only (gen-quest client). The main backend (gen-backend) is out of scope.

---

## How This Was Built

**Step 1 — consumed-hooks grep** (run in `tasmil-finance/`):

```
grep -rhoE "use[A-Z][a-zA-Z]*Controller[A-Za-z]*" \
  src/features/quest "src/app/(quest)" src/shared/layout src/shared/components \
  | sort -u
```

Auth flows that bypass hooks and call `apiClient` directly (via
`src/features/quest/context/wallet-context.tsx` and
`src/features/quest/lib/dev-login-bridge.ts`) are noted separately.

---

## Endpoint Table

### Auth controller

| Endpoint | Hook / call | Consumed? | Component | Note |
|---|---|---|---|---|
| `POST /auth/challenge` | direct `apiClient.post` | ✅ | `wallet-context.tsx` | Step 1 of wallet auth flow; called directly, not via gen-quest hook |
| `POST /auth/verify` | direct `apiClient.post` | ✅ | `wallet-context.tsx` | Step 2 of wallet auth; exchanges signed message for JWT |
| `POST /auth/wallet-login` | `useAuthControllerWalletLogin` | ❌ | — | Superseded by challenge/verify two-step flow; hook generated but unused (intentional) |
| `POST /auth/refresh` | direct `apiClient` interceptor | ✅ | `src/features/quest/lib/api-client.ts` | Called automatically in the axios response interceptor on 401 |
| `POST /auth/logout` | `useAuthControllerLogout` | ✅ | `wallet-context.tsx` (disconnect handler) | |
| `POST /auth/dev-login` | direct `fetch` | ✅ | `src/features/quest/lib/dev-login-bridge.ts` | Dev/test bypass only; never present in prod builds |
| `POST /auth/username-login` | `useAuthControllerUsernameLogin` | ❌ | — | No username/password UI implemented; backlog |
| `GET /auth/nonce` | `useAuthControllerGetWalletNonce` | ❌ | — | Challenge endpoint replaced the nonce flow; intentionally unused |

---

### Users controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /users/me` | `useUsersControllerGetMe` | ✅ | `wallet-context.tsx`, `QuestHeaderBadges`, `WalletRankInfo`, `QuestNav`, `CampaignDetail` | Core identity fetch used across the surface |
| `PATCH /users/profile` | `useUsersControllerUpdateProfile` | ✅ | `Profile` | Edit-profile form |
| `GET /users/:id` | `useUsersControllerGetUser` | ❌ | — | No public-profile-by-ID route exists in the app; backlog |
| `GET /users/points-history` | `useUsersControllerGetPointsHistory` | ✅ | `Profile` (points ledger tab) | Closed by Plan 2/3 |
| `GET /users/referrals` | `useUsersControllerGetReferrals` | ✅ | `Profile` (referral list) | |
| `POST /users/daily-login` | `useUsersControllerDailyLogin` | ✅ | `Navbar`, `QuestHeaderBadges`, `QuestNav` | Check-in mutation |
| `GET /users/check-in-status` | `useUsersControllerGetCheckInStatus` | ✅ | `Navbar`, `QuestHeaderBadges`, `QuestNav` | Drives streak badge; closed by Plan 3 |
| `GET /users/my-campaigns` | `useUsersControllerGetMyCampaigns` | ✅ | `Profile` (My Quests tab), `Navbar` (sponsor badge) | Closed by Plan 2/3 |

---

### Campaigns controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /campaigns` | `useCampaignsControllerFindAll` | ✅ | `Campaigns`, `Explore` | Campaign list + featured campaigns |
| `GET /campaigns/:id` | `useCampaignsControllerFindOne` | ✅ | `CampaignDetail` | Campaign detail page |
| `POST /campaigns/:id/join` | `useCampaignsControllerJoinCampaign` | ✅ | `CampaignDetail` | |
| `POST /campaigns/:id/claim` | `useCampaignsControllerClaimCampaign` | ✅ | `CampaignDetail` | |
| `GET /campaigns/not-joined` | `useCampaignsControllerGetNotJoinedCampaigns` | ✅ | `CampaignDetail` (discover sidebar) | |
| `GET /campaigns/:id/tasks` | `useCampaignsControllerGetTasks` | ❌ | — | Tasks are fetched inline from the `findOne` response; standalone tasks endpoint not called. Intentional (data already included). |
| `GET /campaigns/:id/claims` | `useCampaignsControllerGetClaims` | ❌ | — | Claim status is tracked per-task via `useTasksControllerGetClaimStatus`; the campaign-level claims endpoint is not needed. Intentional. |

---

### Tasks controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /tasks/:id` | `useTasksControllerGetTask` | ❌ | — | Task detail surfaced via campaign `findOne`; standalone task fetch not needed. Intentional. |
| `GET /tasks/:id/status` | `useTasksControllerGetStatus` | ✅ | `CampaignDetail` | Per-task completion status |
| `GET /tasks/:id/claim-status` | `useTasksControllerGetClaimStatus` | ✅ | `CampaignDetail` | Per-task claim/reward state |
| `POST /tasks/:id/claim` | `useTasksControllerClaimTask` | ✅ | `CampaignDetail` | |
| `POST /tasks/:id/verify` | `useTasksControllerVerifyTask` | ✅ | `CampaignDetail` | On-chain or social verification call |
| `POST /tasks/:id/submit-proof` | `useTasksControllerSubmitProof` | ❌ | — | No proof-upload UI implemented; backlog (required for manual/image-proof task types) |
| `POST /tasks/:id/complete-by-action` | `useTasksControllerCompleteByAction` | ❌ | — | Server-side action completion (e.g. webhook-triggered); no FE trigger surface needed. Intentional. |
| `POST /tasks/:id/record-visit` | `useTasksControllerRecordVisit` | ✅ | `src/app/(quest)/quest/visit/[taskId]/page.tsx` | Redirect-and-record page |

---

### Seasons controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /seasons/current` | `useSeasonsControllerCurrent` | ✅ | `Leaderboard` | Active season metadata |
| `GET /seasons/leaderboard` | `useSeasonsControllerLeaderboard` | ❌ | — | Leaderboard uses the Analytics controller (`globalLeaderboard` / `streakLeaderboard`) instead; seasons leaderboard endpoint not called. Intentional. |
| `GET /seasons/my-result` | `useSeasonsControllerMyResult` | ✅ | `Leaderboard`, `WalletRankInfo`, `RankRevealGate` | Closed by Plan 3 |
| `POST /seasons/reveal-ack` | `useSeasonsControllerRevealAck` | ✅ | `RankRevealGate` | One-time rank-reveal acknowledgement |

---

### Referral controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /referral/me` | `useReferralControllerGetMyReferral` | ✅ | `Profile` (referral tab) | My referral code + stats |
| `GET /referral/tree` | `useReferralControllerGetTree` | ✅ | `Referrals` | Referral tree visualization |
| `GET /referral/leaderboard` | `useReferralControllerGetLeaderboard` | ❌ | — | No referral leaderboard UI surfaced; backlog |

---

### Social Accounts controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /social-accounts` | `useSocialAccountsControllerFindAll` | ✅ | `Profile`, `CampaignDetail` | Lists linked social accounts |
| `POST /social-accounts/link` | `useSocialAccountsControllerLinkAccount` | ✅ | `Profile`, `CampaignDetail` | OAuth link flow |
| `DELETE /social-accounts/:id` | `useSocialAccountsControllerUnlinkAccount` | ✅ | `Profile` | Closed by Plan 2/3 |

---

### Notifications controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /notifications` | `useNotificationsControllerList` | ❌ | — | No notification feed/bell UI in quest surface; backlog |
| `POST /notifications/send` | `useNotificationsControllerSend` | ❌ | — | Admin/server-triggered only; no user-facing send UI. Intentional. |

---

### Analytics controller

| Endpoint | Hook | Consumed? | Component | Note |
|---|---|---|---|---|
| `GET /analytics/global-leaderboard` | `useAnalyticsControllerGlobalLeaderboard` | ✅ | `Leaderboard` | Points leaderboard tab; closed by Plan 3 |
| `GET /analytics/streak-leaderboard` | `useAnalyticsControllerStreakLeaderboard` | ✅ | `Leaderboard` | Streak leaderboard tab; closed by Plan 3 |
| `GET /analytics/system` | `useAnalyticsControllerSystemAnalytics` | ❌ | — | Admin-only aggregates; intentionally unused in user-facing FE |

---

### Admin controller (quest)

All admin-controller hooks (`useAdminController*`, `useAdminSeasonsController*`) are generated but **not consumed** in the user-facing quest frontend. These belong to a separate internal admin app (not part of this repo's user-facing surface). Classification: **intentional**.

| Endpoint group | Consumed? | Note |
|---|---|---|
| Campaign CRUD (create/update/delete) | ❌ | Admin app only |
| Task CRUD (add/update/remove) | ❌ | Admin app only |
| Season CRUD (create/update/end/mark-payout/set-rank-rewards) | ❌ | Admin app only |
| User task approve/reject | ❌ | Admin app only |
| Referral config (list/update) | ❌ | Admin app only |

---

## Closed by This Effort (Plans 2–3)

The following gaps were open before `feat/quest-cross-surface` and are now wired:

| Feature | Endpoint(s) | Consuming Component |
|---|---|---|
| My Quests tab in Profile | `GET /users/my-campaigns` | `Profile` |
| Points ledger in Profile | `GET /users/points-history` | `Profile` |
| Social account unlink | `DELETE /social-accounts/:id` | `Profile` |
| Streak leaderboard | `GET /analytics/streak-leaderboard` | `Leaderboard` |
| Global points leaderboard | `GET /analytics/global-leaderboard` | `Leaderboard` |
| My rank / season result | `GET /seasons/my-result` | `WalletRankInfo`, `Leaderboard`, `RankRevealGate` |
| Daily check-in badge | `GET /users/check-in-status` + `POST /users/daily-login` | `QuestHeaderBadges`, `Navbar`, `QuestNav` |
| Sponsor badge in Navbar | derived from `GET /users/my-campaigns` (`metadata.sponsor`) | `Navbar` |

---

## Still Unwired — Classification

### Intentional (no user-facing action needed)

| Endpoint | Reason |
|---|---|
| `POST /auth/wallet-login` | Superseded by the two-step challenge/verify flow |
| `GET /auth/nonce` | Challenge endpoint covers this; nonce hook generated but unused |
| `POST /tasks/:id/complete-by-action` | Server/webhook-triggered; FE never initiates |
| `GET /campaigns/:id/tasks` | Task list is embedded in `campaigns/:id` `findOne` response |
| `GET /campaigns/:id/claims` | Per-task claim status is fetched via `tasks/:id/claim-status` |
| `GET /tasks/:id` (standalone) | Task data comes from `campaigns/:id` |
| `GET /seasons/leaderboard` | Analytics controller endpoints are used instead |
| `POST /notifications/send` | Admin/server send only; no user-initiated sends |
| `GET /analytics/system` | Admin aggregates; out of scope for user FE |
| All Admin controller endpoints | Separate admin app; intentionally not in user-facing quest FE |

### Backlog (user-facing feature not yet built)

| Endpoint | Missing Feature |
|---|---|
| `POST /auth/username-login` | Username/password login UI |
| `GET /users/:id` | Public profile page by user ID (no route exists) |
| `POST /tasks/:id/submit-proof` | Proof-upload UI for manual/image-proof task types |
| `GET /referral/leaderboard` | Referral leaderboard view |
| `GET /notifications` | Notification feed / bell component |
