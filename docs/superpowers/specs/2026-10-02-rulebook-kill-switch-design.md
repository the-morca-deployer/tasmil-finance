# Compact Rulebook and Vault Kill Switch Design

## Goal

Make My Rulebook concise and let a vault owner pause or resume all agent sessions with the keeper-wallet's on-chain kill switch.

## Product behavior

- The main Rulebook view shows one compact Policy Guard card, four session metrics, and one compact row per permission.
- The Policy Guard card shows the current vault kill-switch state and one action: **Pause agent** when off, **Resume agent** when on.
- The action builds `set_kill_switch(owner, enabled)` for the current keeper wallet, asks the connected owner wallet to sign it, submits it through the existing transaction endpoint, then refetches Rulebook state.
- Enabling the switch requires a short confirmation dialog. Disabling it still requires the wallet signature but no additional warning dialog.
- Pending state disables the action. Backend, signing, submission, and readback errors remain visible in the Policy Guard card.
- Owner withdrawal remains available in both states.
- Session-key revocation remains a separate permanent action and is labeled **Revoke Session Key**.

## Compact information hierarchy

The default view contains:

1. `Policy Guard active` or `Agent paused`, an `ON`/`OFF` badge, the kill-switch action, and the single line `Stops all agent sessions. Withdrawals stay available.`
2. Session key, status, and four metrics: spent, calls, expiry, cooldown.
3. One-line permissions: action, asset, maximum amount, and shortened venue address.

The following move into a closed **Technical details** disclosure:

- network and read ledger;
- keeper contract and explorer link;
- raw base-unit limits;
- expiry/reset ledger numbers;
- conversion evidence and price timestamps.

Remove the standalone owner-exit banner, verbose no-price paragraph, and repeated session summary footer.

## Backend design

- Add authenticated owner endpoint `POST /api/account/kill-switch` with `{ publicKey, enabled }`.
- Resolve the caller's VAULT managed account and build an unsigned keeper-wallet `set_kill_switch` transaction.
- Add `StellarService.buildSetKillSwitchTx(ownerPubkey, keeperWalletAddress, enabled)` following the existing revoke transaction builder.
- Reuse `/api/account/submit` for the signed XDR without adding a database status transition. The on-chain Rulebook read is authoritative.
- Reject malformed owner keys, missing vaults, and owner/account mismatches through existing guards and account lookup behavior.

## Frontend design

- Add a mutation for `/api/account/kill-switch` and a focused hook that signs and submits the returned XDR.
- Pass the mutation state into `RulebookContent`; keep the read hook authoritative and call `refetch()` only after confirmed submission.
- Keep destructive confirmation local to the Policy Guard card.
- Use the existing Collapsible primitive for Technical details.
- Preserve accessible names and keyboard operation for the action, confirmation, and disclosure.

## Tests

- Backend unit tests cover XDR construction, owner-only controller/service behavior, both boolean states, and errors.
- Frontend hook tests cover build, sign, submit, refetch, and failure paths.
- Rulebook component tests cover compact default content, hidden technical content, kill-switch ON/OFF labels, confirmation, pending state, and concise permission rows.
- Farming tests continue to distinguish **Revoke Session Key** from the vault kill switch.
- Playwright covers the Rulebook tab on desktop and mobile with deterministic API fixtures, including opening Technical details and the Pause agent confirmation without submitting a real transaction.

## Non-goals

- No global Tasmil engine halt controls.
- No session-key rotation redesign.
- No changes to keeper-wallet contract semantics.
- No real on-chain transaction in automated browser tests.
