# Quest Campaign Task-Check Fix Plan (Phase 2)

> **For agentic workers:** execute task-by-task with subagent-driven-development. Steps use `- [ ]`.

**Goal:** Make every task in the two live Quest campaigns have correct, trustworthy completion-check logic, per the audit and the product decisions below.

**Repos:** `backend/` (NestJS quest module) and `tasmil-finance/` (frontend). Branches: reuse `feat/quest-referral-e2e` in each (this work continues the same review/QA stream).

## Decisions (locked with product)
- **Connect wallet + Sign message → real verification** (not a 30s page-visit trust stub).
- **Blend deposit → keep `reward_volume_events`** mechanism; fix stale hard-coded contract ids (source from env/registry) and keep protocol scoping.
- **Swap / trade-volume task → SKIP** (`VOLUME_SWAP` is a dead enum; not present in either campaign; do not add).
- **REFERRAL daily → keep "new referee today" semantics**; just ensure it works end-to-end and is checkable.

## The two campaigns
- **Daily Missions** (`daily-missions`, isDaily): `LOGIN_CHECKIN` (10), `STRATEGY_CHECKIN` (15), `REFERRAL` (50).
- **Tasmil Explorer: Your First Steps** (5 one-time tasks): Connect wallet (BROWSE/`wallet_connect`), Sign message (BROWSE/`sign_message`), Chat agent (AGENT_CHAT/`first_chat`), Vault preview (BROWSE/`vault_preview`), Supply to Blend (ONCHAIN, contract `CBDIZJSO2KFKZK3ODKLBL6CH2DKXPLNMOKSJBBBUFKWGZJN3JHRBKGI`).

## Key files (from audit)
- `backend/src/modules/quest/social-verification/social-verification.service.ts` - the `/quest/tasks/:id/verify` dispatcher (switch on `task.type`); BROWSE→visit proof (`:102-124`), AGENT_CHAT (`:131-156`), ONCHAIN→`verifyOnchain` (`:361`) with hard-coded `CONTRACT_PROTOCOL_MAP` (`:19-24`).
- `backend/src/modules/quest/.../shared-db.service.ts` - `hasProtocolActivity` over `reward_volume_events`.
- `backend/src/modules/quest/claims/claims.service.ts` - `claimDailyTask` (REFERRAL count `:61-72`, LOGIN_CHECKIN).
- Auth signature verification to reuse: `backend/src/modules/auth/auth.service.ts` `verifySignedMessage` (`:257`).
- Seed: `backend/prisma/quest-seed.ts` (`:201-250`) + `backend/scripts/seed-week1-campaigns.ts` read a JSON that now only exists under `deprecated/side-repo/...` → ENOENT.
- Frontend: `tasmil-finance/src/features/quest/components/CampaignDetail.tsx` branches on `type.toLowerCase()==="visit"` but backend returns `BROWSE`.

## Global Constraints
- Do not break the `/verify` path the frontend actually uses (`useTasksControllerVerifyTask`).
- Reuse existing services; do not hard-code contract ids in new code - read from env/registry.
- Backend follows existing module style; TDD with Jest `*.spec.ts`. Frontend Biome (2-space, double quotes, no any, no console.log), Jest+RTL.
- Each task ends with a commit and passing focused tests.

---

## Task P2-1 (backend): Real check for `wallet_connect`
**File:** `social-verification.service.ts`; Test: its `.spec.ts`.
A user can only attempt a quest task while authenticated, and quest auth IS a wallet connection (the user row has `stellarPubkey`). So `wallet_connect` should verify the user has a bound wallet, not a page dwell.
- [ ] Write a failing test: verifying a task whose `metadata.checkId === "wallet_connect"` returns success when the user has a `stellarPubkey`, and failure when not.
- [ ] In `verifyTask`, before/within the BROWSE branch, special-case `checkId === "wallet_connect"`: load the user; pass iff `user.stellarPubkey` is present; mark `COMPLETED`. Do not require a visit proof.
- [ ] Run tests green; commit `feat(quest): wallet_connect task verifies a bound wallet, not a page visit`.

## Task P2-2 (backend + frontend): Real signature check for `sign_message`
Genuine signature verification, distinct from wallet_connect.
**Backend** (`social-verification.service.ts` + a controller; reuse `auth.service.ts` `verifySignedMessage`):
- [ ] Add a way for the client to submit a signed challenge for the sign_message task: extend the verify request (or a dedicated `POST /quest/tasks/:id/sign-proof`) to accept `{ signedMessage }`. Verify the signature against the user's `stellarPubkey` using the existing `verifySignedMessage` logic (extract/share it if private). On valid signature, store proof and mark `COMPLETED`; on invalid, return a clear failure.
- [ ] Tests: valid signature → COMPLETED; wrong/forged signature → rejected; reused/expired challenge → rejected (mirror auth's nonce handling if you issue a challenge).
**Frontend** (`tasmil-finance`, the sign_message task action in CampaignDetail / quest task UI):
- [ ] When the user actions the sign_message task, prompt a wallet signature via the existing StellarWalletsKit signMessage path (the same kit `wallet-context.tsx` uses) over the task challenge, then submit to the backend endpoint above. Show success/failure. Add a focused test for the submit wiring.
- [ ] Commit backend and frontend separately: `feat(quest): sign_message task verifies a real Stellar signature`.

## Task P2-3 (backend): Blend deposit - de-hardcode contract ids, keep `reward_volume_events`
**File:** `social-verification.service.ts` (`CONTRACT_PROTOCOL_MAP`, `verifyOnchain`).
- [ ] Replace the hard-coded `CONTRACT_PROTOCOL_MAP` with values sourced from env/registry (read the strategy/protocol contract ids from config the way other modules do; cross-check the mainnet registry id in CLAUDE.md / `backend/.env`). Keep the `reward_volume_events` + `hasProtocolActivity` check unchanged.
- [ ] Keep protocol scoping (the ONCHAIN task must check the protocol matching its configured contract). Confirm the Blend id in the campaign seed maps to `blend`.
- [ ] Tests: a known contract id maps to the right protocol; an unknown/left-out id returns "unknown contract" rather than silently passing; `hasProtocolActivity` true→COMPLETED.
- [ ] Commit `fix(quest): source onchain task contract ids from config, not hard-coded map`.

## Task P2-4 (backend): Fix campaign seed ENOENT
**Files:** `backend/prisma/quest-seed.ts`, `backend/scripts/seed-week1-campaigns.ts`.
The week1 campaign JSON moved to `deprecated/side-repo/...`; both loaders read a path that no longer resolves.
- [ ] Move/copy the canonical `week1-campaigns-seed.json` into the live `backend/` tree (e.g. `backend/data/week1-campaigns-seed.json`) and update both loaders to read the live path. Strip the stale ngrok `urlAction` URLs (`wisdom-rover-sphere.ngrok-free.dev`) - replace with the real app/quest URLs or relative paths.
- [ ] Verify the seed loads without ENOENT (dry-run the loader logic or a focused unit that resolves the path). Commit `fix(quest): restore week1 campaign seed to live path, drop stale ngrok urls`.

## Task P2-5 (frontend): Fix `visit` vs `BROWSE` type mismatch
**File:** `tasmil-finance/src/features/quest/components/CampaignDetail.tsx` (`:335-339`, `:390-395`).
Backend returns `taskType: "BROWSE"` but the UI branches on `type.toLowerCase()==="visit"`, so checkId-specific icons/labels never render.
- [ ] Update the UI conditions to match the real backend type (`"browse"`) (and keep any legacy `"visit"` alias if still emitted elsewhere). Verify the wallet_connect/sign_message/vault_preview rows render their intended icon/label.
- [ ] Add/adjust a focused test. Commit `fix(quest): render BROWSE task icons/labels (was checking stale 'visit')`.

## Task P2-6 (backend): Confirm + harden daily checks (REFERRAL, STRATEGY_CHECKIN)
**File:** `claims.service.ts`; Test: its `.spec.ts`.
- [ ] REFERRAL daily: keep "new referee today" semantics. Add a test proving: with a `quest_referral_events` row dated today → claim succeeds; with none today → `NO_REFERRAL_TODAY`. Confirm the event is actually produced by `handleReferralReward` on a referred user's first qualifying action (trace + assert the wiring is intact after Phase 1).
- [ ] STRATEGY_CHECKIN: it is a self-claim daily with no verification. Confirm once-per-day uniqueness holds (shares the daily-completion unique key). Add a test for once/day. (Do not add heavy strategy-state checks; product treats it as a daily self-claim like LOGIN_CHECKIN.)
- [ ] Commit `test(quest): cover REFERRAL daily and STRATEGY_CHECKIN once-per-day checks`.

## Out of scope
- `VOLUME_SWAP` / swap task (skipped per decision).
- X / Discord verification env keys (not used by either campaign).
- Deduping the two `complete-by-action` endpoints - note for follow-up; the frontend uses `/verify`, so it does not affect the two campaigns. If time permits, gate or remove the unused one.

## Verification
- Backend: focused specs per task green; full quest suite no new failures.
- Frontend: focused tests + type-check + lint clean on changed files.
- Manual: walk each task in both campaigns and confirm it completes only when its real condition is met.
