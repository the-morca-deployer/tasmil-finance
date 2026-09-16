# farming-3 — Heron UI Port

**Date:** 2026-08-17
**Status:** Approved
**Route:** `/farming-3` (new; `/farming` and `/farming-2` both stay untouched as references)

---

## Problem

`/farming`'s presentation is the weak part of the feature, not its mechanics. The underlying flow was proven working on Stellar mainnet on 2026-08-17: a keeper wallet deploys, a session key is registered, the allocation engine autonomously deposits into Blend, and the position accrues real yield at ~6.5% measured on-chain. What the user sees does not do that justice.

Heron (`/Users/nathan/Documents/morcalab/heron-system/heron/app/web`) already has a console UI whose shape matches the flow we want: pick a strategy → deposit → sign the chain of transactions → land on a dashboard and watch APY. We port that presentation layer onto the existing Stellar data layer.

---

## Stack compatibility

Verified before committing to the port:

| | tasmil-finance | heron |
|---|---|---|
| next | 16.1.1 | 16.2.12 |
| react | ^19.2.1 | 19.2.4 |
| tailwindcss | ^4.1.18 | ^4 |
| class-variance-authority | ^0.7.1 | ^0.7.1 |
| tailwind-merge | ^3.4.0 | ^3.6.0 |
| lucide-react | ^0.562.0 | ^1.27.0 |
| @base-ui/react | absent | ^1.6.0 |

Two gaps, both resolved by adapting rather than installing:

- **`@base-ui/react` will not be added.** `tasmil-finance` is not shadcn-managed (no `components.json`); it has a hand-rolled primitive set in `src/shared/ui` (alert, badge, button, card, dialog, popover, …). Adding a second primitive system would leave two UI dialects in one repo — precisely the debt that `farming` vs `farming-2` already demonstrates. Heron components that reach for base-ui get rewritten against `src/shared/ui`.
- **`lucide-react` stays on the tasmil version.** The major-version gap means some icon names differ; remap them rather than installing a second copy.

---

## Scope

### Port

| Heron source | Lines | Treatment |
|---|---|---|
| `components/console/ui.tsx` | 393 | Port — console-level primitives (panel, stat, hairline) |
| `components/console/journey.tsx` | 192 | Port — the multi-step signing frame; the core of the flow |
| `components/console/shell.tsx` | 741 | Port partially — chrome and layout for a single route only; drop heron's multi-page sidebar |
| `components/console/pages/pools.tsx` | 491 | Port — strategy selection |
| `components/console/pages/dashboard.tsx` | 1760 | Do **not** port wholesale — lift only the yield-relevant cards |

### Do not port

Everything chain-specific to EVM/Solana: Circle appkit, Privy, Reown, `chain-binding-status`, `chain-mismatch`, `weth-wrap`, x402, attestation, TEE, distribution. Stellar has no equivalent; porting them produces dead code.

---

## Data layer

No new hooks. The port is presentation-only and reuses what already runs:

- `usePools` — pool/strategy list (`GET /api/pools`)
- `usePosition` — position, P&L, APY (`GET /api/account/position/:publicKey`)
- `useRebalanceStatus` — bot ready/halted state
- `use-farming-actions` — deposit/withdraw actions

Note the unit convention that has already caused one 100x display bug: `position.currentApy` and `positions[].apy` are **decimal fractions** (`0.0671` = 6.71%), and every consumer must multiply by 100 before display.

---

## The signing journey is three steps, not two

The requested flow said "sign 2 TXs". On mainnet today it is three:

1. `deploy` — deploy the keeper-wallet contract
2. `configure_session_key` — register the bot's session key
3. `fund` — transfer the deposit into the keeper wallet

Steps 1 and 2 are separate because the pinned mainnet WASM `fefa7c8e…` exposes `__constructor(owner, owner_pubkey)` — two parameters, no room for session config. The six-parameter build (used on testnet) exists precisely to collapse deploy + configure into one signature, but putting it on mainnet is a WASM upload (~26–36 XLM per `CLAUDE.md`) and a separate deployment decision, out of scope here.

**Design requirement:** the journey must render its steps from a list, so that collapsing three steps into two later is a data change, not a rewrite of the frame.

Each step shows: pending / signing / confirmed state, the transaction hash once known, and a link to `stellar.expert/explorer/public`.

---

## Structure

```
src/features/farming-3/
├── components/    ported console UI + farming screens
├── hooks/         thin wrappers only; no new data fetching
├── types.ts
└── index.ts       barrel — consumers import "@/features/farming-3"
```

Feature isolation rules apply: `farming-3` must not import from `farming`, `farming-2`, or any other feature. Shared pieces come from `src/shared/`. Route file is `src/app/(dashboard)/farming-3/page.tsx` and contains routing only.

Conventions enforced by Biome: 2-space indent, width 100, double quotes, `import type` for type-only imports, no `any`, no `console.log`, Server Components by default with `"use client"` only where needed.

---

## Verification

The dashboard can be checked against **real data, not mocks**: the mainnet test wallet `GCQRJ4ALV2NX224N2BUS5OSIF7LDOLYM42ZRQHJN2PSZQLTD2O5ZUBHE` currently holds an `ACTIVE` account whose keeper `CDALQPJ4IPYKEM52ZB7QKCUAOIOFNVQ2V4AXPNWERJS565WTSSZPQSL4` has a live position of ~1.4999 USDC in Blend accruing at ~6.5% APY. Load `/farming-3` as that wallet and the numbers must match `strategy.balance(keeper)` read directly from Soroban.

The onboarding journey cannot be replayed without a fresh funded wallet, so it is covered by unit tests over its step state machine instead of a live run.

Gates: `pnpm type-check`, `pnpm test`, `pnpm lint`.

---

## Out of scope

- Changing `/farming` or `/farming-2`. Both remain as references until `/farming-3` is accepted.
- Uploading a new keeper-wallet WASM to mainnet to reduce the signature count.
- Any backend or contract change. This is a presentation-layer port.
