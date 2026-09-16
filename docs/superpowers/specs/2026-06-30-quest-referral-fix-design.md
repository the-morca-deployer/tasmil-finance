# Quest Referral - End-to-End Fix Design

**Date:** 2026-06-30
**Status:** Approved (design) - pending implementation plan
**Scope:** `tasmil-finance` (frontend) + `backend` (NestJS API + Prisma). Touches the **Quest L1/L2/L3 commission** referral system only. The waitlist referral and the dashboard "Credits" referral are intentionally left unchanged.

---

## 1. Problem Statement

The Quest referral system advertises multi-level commissions (L1 = 10%, L2 = 3%, L3 = 1% of a referee's Quest Points), and the server-side machinery for it already exists - config table (`QuestReferralConfig`), commission ledger (`QuestReferralCommission`), the cascade algorithm (`commission.service.ts`), the read endpoints, and the seeded bps rows. **But the feature does not work end-to-end** because:

1. **Referral attribution is never persisted.** The only code that writes `UserQuestProfile.referredById` is `UsersService.ensureWalletUser()`, which has zero callers. The live auth path (`POST /auth/challenge` → `POST /auth/verify`) ignores referral codes entirely, and the `UserQuestProfile` row is created lazily (on first point/profile mutation) with a fresh random code and `referredById = null`. So the referral chain the cascade walks is always empty.
2. **The commission cascade is wired into only 1 of 4 point-award paths** (`claimOneTimeTask`). `claimDailyTask`, `claimCampaign`, and `dailyLoginReward` award points but never call `applyCommissions`.
3. **Frontend referral links are broken / inconsistent.** `/r/<code>` redirects to `/?ref=` (homepage), which no longer reads `?ref=`. The Quest Profile "Share Link" buttons have no handlers; "Set custom code" is `onClick={() => {}}`; one copy button can copy the literal `"-"` placeholder. There are two incompatible link schemes (`/r/<code>` vs `/waitlist?ref=`).
4. **No surface shows a user their referrer.** The account dropdown shows neither the user's referral code nor who referred them.

### Goal
Copy/share produces a correct link with the correct code → a recipient who disconnects and connects a **new** wallet via that link gets their referral saved to the DB (without conflict/overwrite) → every time that referee earns Quest Points, their L1/L2/L3 uplines automatically receive commission → the account dropdown shows the user's own referral code and their referrer.

---

## 2. Approved Decisions

| Decision | Choice |
|---|---|
| Scope | Frontend + Backend, **with automated tests** (budget approved) |
| Canonical link scheme | Unify on `https://tasmil.finance/r/<code>` → redirects into `/quest` carrying the ref |
| Commission trigger | **All** point-award paths (one-time task, daily task, campaign, daily login) |
| Conflict policy | **First-touch-per-user**: save `referredById` only when currently null; never overwrite |

---

## 3. Anti-Conflict / Persistence Model (key requirement)

The pending referral code must survive: copy link → disconnect → connect a **new** wallet → new wallet opens the ref link → still saved, with no conflict against the previous wallet.

- `/r/<code>` writes `localStorage["tasmil.referral.pendingCode"] = code` (persists across disconnect and wallet switch in the same browser) and redirects to `/quest?ref=<code>`.
- On every Quest wallet connect, the client sends `referredByCode` = `?ref=` (preferred) or `pendingCode` (fallback) to `/auth/verify`.
- The backend applies **first-touch-per-user**: it sets `referredById` only if the connecting user's `referredById` is currently `null`, the code resolves to a *different* valid user, and linking would not create a cycle. If the user already has a referrer, the code is **ignored** (idempotent, no overwrite, no error).
- `pendingCode` is **not** auto-cleared, so a freshly connected new wallet can still consume it; an incoming `?ref=` always overrides the stored value. (Optional: clear once the backend confirms attribution was applied.)

Because attribution is keyed per *connecting user* and is write-once, two different wallets in the same browser never conflict: the first wallet's `referredById` is untouched when the second wallet links.

---

## 4. Backend Changes (`backend/`)

### 4.1 Capture & persist `referredById` at login
- Extend the `/auth/verify` request DTO with an optional `referredByCode?: string`.
- After the existing `User` upsert in `auth.service.ts`, call a new `UsersService.linkReferrer(userId, referredByCode)` helper that:
  - Resolves the referrer via `questProfile.referralCode`.
  - Ensures the connecting user's `UserQuestProfile` exists (create/upsert) and sets `referredById` **only when** it is currently null, `referrer.id !== userId`, and linking does not create a cycle.
  - Is a no-op when `referredByCode` is absent/invalid or the user already has a referrer.
- Remove or fold in the dead `ensureWalletUser` so there is a single profile-creation path that respects `referredById`.

### 4.2 Wire the commission cascade into all award paths
Add `await this.commissionService.applyCommissions(tx, userId, BASE_POINTS, sourceClaimId)` to each path, **after** the idempotent award row is created, passing **base points (pre-FOMO-multiplier)** - consistent with the existing `claimOneTimeTask` caller:
- `claimDailyTask` - after `questDailyTaskCompletion` create; `BASE_POINTS = task.pointReward`; `sourceClaimId =` completion id.
- `claimCampaign` - after `questCampaignClaim` create; `BASE_POINTS = rewardPoints`; `sourceClaimId =` claim id.
- `dailyLoginReward` (in `users.service.ts`, +10) - `BASE_POINTS = 10`; `sourceClaimId = "dailylogin:{userId}:{utcDate}"`.

**Invariant:** callers pass pre-multiplier base points, never `award.pointsAwarded`. The cascade re-applies the FOMO multiplier via `PointsService.award`, keeping each upline's commission proportional to the referee's actual (FOMO-boosted) earnings. (No change to `commission.service.ts` math.)

### 4.3 Expose the referrer in `/referral/me`
- `getMyReferral` returns an additional `referredBy` field: `{ code, name | walletAddress } | null` - the current user's direct upline - for the dropdown.

### 4.4 Idempotency hardening (recommended)
- Add a unique index `(earnerId, sourceClaimId, layer)` on `QuestReferralCommission` via an idempotent migration in `backend/prisma/migrations/`, so the same award can never double-credit even if call sites change later. The in-transaction guards already prevent this on the normal path; this is defense-in-depth.

---

## 5. Frontend Changes (`tasmil-finance/`)

### 5.1 Unify the link scheme → Quest
- `src/app/r/[code]/page.tsx`: redirect to `/quest?ref=<code>` (instead of `/?ref=`), keep the `localStorage` write.

### 5.2 Capture ref on Quest wallet connect
- `src/features/quest/context/wallet-context.tsx`: before `POST /api/auth/verify`, read `?ref=` or `localStorage.pendingCode` and include `referredByCode` in the payload. The BFF route (`src/app/api/auth/verify/route.ts`) already forwards the body verbatim.

### 5.3 Fix Quest Profile copy/share
- `src/features/quest/components/Profile.tsx`:
  - Add `buildShareUrl(code) = https://tasmil.finance/r/<code>`.
  - Wire both "Share Link" buttons (Overview + ReferralsTab) to copy the URL / open an X intent.
  - Wire "Set custom code" (currently `() => {}`) to `POST /users/me/referral-code`, then invalidate the referral query.
  - Guard the ReferralsTab "Copy Code" so it never copies the `"-"` placeholder.

### 5.4 Account dropdown shows code + referrer (key requirement)
- `src/features/quest/components/Navbar.tsx`: in **both** dropdown instances (desktop and mobile), above "Copy Address", add:
  - **Referral code** row: the user's code + a "copy link" action (`/r/<code>`).
  - **Referred by** row: referrer name/wallet from `referredBy`, or "-/None" when null.
  - Data from `useReferralControllerGetMyReferral`.

---

## 6. Out of Scope (YAGNI)
- `verify-share`, `link-x/start`, `link-x/verify` (missing backend, feature-flag off).
- Merging the three referral systems.
- Waitlist referral and dashboard "Credits" referral remain unchanged (waitlist already works via `/waitlist?ref=`).

---

## 7. Verification

### Automated tests
- **Backend unit** - `commission.service`: single-level credit, full L1/L2/L3 cascade, inactive-layer skip, self-referral guard, cycle guard, `referredById = null` no-op.
- **Backend unit** - `UsersService.linkReferrer`: first-touch sets once; second code ignored; self-code rejected; invalid code no-op.
- **Backend integration** - each of the 4 award paths credits uplines exactly once; re-claim does not double-credit; `/referral/me` returns `referredBy`.
- **Frontend unit** - `/r/[code]` redirect target; `wallet-context` includes `referredByCode`; `Profile` share/copy/set-code handlers; Navbar dropdown renders code + referrer.

### Manual / E2E
1. Wallet A connects, gets code `codeA`; copy link `/r/codeA`.
2. Disconnect; connect a **new** wallet B by opening `/r/codeA` → assert DB `B.referredById = A`.
3. B claims a one-time task, a daily task, a campaign, and does a daily check-in → assert A receives an L1 commission for each.
4. Add wallet C referred by B; C earns points → assert B gets L1 and A gets L2 (and a 4th level D → A gets L3, nothing beyond L3).
5. B's account dropdown shows B's own code and "Referred by: A".
6. Re-open `/r/codeA` as already-referred B → no change, no error (first-touch).

---

## 8. Risks
- `/auth/verify` is the shared login path: `referredByCode` must be strictly optional and must not affect existing logins.
- The Prisma migration (unique index) must be idempotent and safe on a DB with existing commission rows.
- Lazy `UserQuestProfile` creation happens in several places; `linkReferrer` must converge them so attribution isn't silently lost when a profile is created by a non-auth path first.
