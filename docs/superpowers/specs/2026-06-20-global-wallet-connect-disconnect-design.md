# Global Wallet Connect / Disconnect — Design

Date: 2026-06-20
Branch: `feat/merge-landing-quest` (frontend repo `tasmil-finance`)
Status: Approved (design)

## Problem

Wallet connection state is fragmented across the app. There are two parallel
systems:

- **Shared** — `useWalletStore` (`wallet-storage`) + `useAuthStore`
  (`auth-storage`), authenticating against the main backend
  (`NEXT_PUBLIC_BACKEND_URL`, httpOnly cookie JWT). Used by landing, waitlist,
  access, chat, dashboard.
- **Quest** — `useQuestWalletStore` (`quest-wallet-storage`) + `useQuestAuthStore`
  (`quest-auth-storage`), authenticating against a separate quest backend
  (`NEXT_PUBLIC_QUEST_API_URL`, access/refresh tokens in localStorage). Mounted
  by its own `WalletProvider` in `src/app/(quest)/layout.tsx`.

Each surface implements its own `connect()` / `disconnect()`. Result: connecting
on one surface does not reflect on another, and a Disconnect button only clears
that surface's stores — not a true global sign-out.

## Goal

One global wallet **connection** state and one standardized connect/disconnect
code path:

- Connect once on any surface → connected everywhere (single tab, persisted
  across reload).
- Disconnect from any surface → wallet disconnected and **both** backend
  sessions cleared everywhere.
- Connect and disconnect logic is a single shared implementation, not
  duplicated per context.

Auth remains per-backend (the two backends cannot share one token), but each
backend auto-authenticates from the already-connected wallet, so the user never
re-connects the wallet.

## Approach (chosen: A — frontend only)

Separate two concerns cleanly:

1. **Wallet connection** (which Stellar address, connected flag) — GLOBAL,
   single source of truth.
2. **Authentication** (backend session) — per-backend, layered on top of the
   shared connection.

No backend changes. All work is in `tasmil-finance` on `feat/merge-landing-quest`.

## Architecture & Components

| Component | Role | Change |
|---|---|---|
| `src/store/use-wallet.ts` (`useWalletStore`, key `wallet-storage`) | Single source of truth for `connected` / `account` | unchanged |
| `src/features/quest/store/use-quest-wallet.ts` | Quest's wallet store | **re-export** `useWalletStore` (drop `quest-wallet-storage`) |
| `src/shared/lib/wallet-session.ts` *(new)* | Canonical global `connectWallet()` + `disconnectAll()` | **new** |
| `src/store/use-auth.ts` / `src/features/quest/store/use-quest-auth.ts` | Per-backend auth | unchanged shape; both cleared by `disconnectAll()` |
| `StellarWalletsKit` | Holds the selected wallet across surfaces | unchanged |

### `src/shared/lib/wallet-session.ts`

```
connectWallet(): Promise<string | null>
  - open StellarWalletsKit authModal, read address
  - set useWalletStore({ connected: true, account: address })
  - return address (no auth here — each backend authenticates separately)

disconnectAll(): Promise<void>
  - StellarWalletsKit.disconnect()
  - useWalletStore.getState().reset()
  - useAuthStore.getState().logout()  +  POST <mainBackend>/api/auth/logout (credentials: include)
  - dynamic import useQuestAuthStore → logout()   (best-effort)
  - redirect to "/" if not already there
  - all network calls are best-effort (try/catch); never block local clearing
```

## Data Flow

**Connect** (any surface): `connectWallet()` opens the kit, sets the shared
store; the kit remembers the selection. Navigating to another surface, that
surface's context reads `kit.getAddress()` + the shared store → shows connected,
then its own `authenticateWithWallet()` runs against its backend.

**Disconnect** (any Disconnect button): `disconnectAll()` → kit disconnect +
shared wallet reset + shared auth logout (+ main backend logout) + quest auth
logout → every surface shows disconnected; redirect home.

## How the two contexts standardize on it

| | Connect | Disconnect |
|---|---|---|
| `src/shared/context/wallet-context.tsx` | `connectWallet()` → `authenticateWithWallet()` (main) | `disconnectAll()` |
| `src/features/quest/context/wallet-context.tsx` | `connectWallet()` → `authenticateWithWallet()` (quest) | `disconnectAll()` |

The open-wallet + set-store + disconnect + clear-sessions logic becomes one code
path. Each context keeps only its backend-specific auth handshake.

## Files to change

1. `src/features/quest/store/use-quest-wallet.ts` — re-export shared store *(done)*
2. `src/shared/lib/wallet-session.ts` — new canonical module
3. `src/shared/context/wallet-context.tsx` — `connect()`/`disconnect()` delegate to the module
4. `src/features/quest/context/wallet-context.tsx` — `connect()`/`disconnect()` delegate to the module

## Edge cases & error handling

- Network logout calls are best-effort (try/catch); failures never block local
  store clearing or the disconnect UX.
- Server-side quest token revoke runs only when disconnecting from the quest
  surface (where the logout mutation is available). From other surfaces, quest
  client tokens are cleared and the server token expires naturally. Acceptable.
- Stale `quest-wallet-storage` in localStorage from previous sessions is ignored
  (no reader after the re-export).
- Dev bypass (`window.__TASMIL_E2E_WALLET__`, `src/lib/dev-bypass.ts`) sets the
  shared store, so quest now also reads as connected under bypass — convenient
  for tests.
- `wallet-session.ts` loads the quest auth store via dynamic import to avoid an
  eager shared→feature coupling.

## Verification (Playwright)

- With dev-bypass on: load app, assert connected on landing, quest, and chat.
- Click Disconnect on one surface; assert disconnected on all three and that
  `wallet-storage` / `auth-storage` / `quest-auth-storage` are cleared.
- Reload mid-session; assert connection persists (single tab).

## Out of scope

- Unifying the two backends into one auth/token (Approach B).
- Multi-tab sync via storage events.
- Any backend changes.
