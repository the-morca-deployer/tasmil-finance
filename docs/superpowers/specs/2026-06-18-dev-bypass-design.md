# Dev Bypass — Design Spec
_Date: 2026-06-18_

## Goal

Allow developers to test the AI chat flow locally (both manual browser testing and automated Playwright/script testing) without needing wallet connection, access code, or JWT signing. Must have zero impact on production.

## Current Problem

Bypass logic is scattered across 9 files with raw `process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"` checks repeated everywhere. Hard to maintain, easy to miss when refactoring.

---

## Architecture

### Frontend — 4 touch points (down from 9)

```
proxy.ts                               server-side gate     (unavoidable)
layout.tsx                             wallet mock script   (unavoidable)
src/lib/dev-bypass.ts                  NEW — constants + module-level store pre-seeding
src/providers/dev-bypass-provider.tsx  NEW — all client logic
chat-page-wrapper.tsx                  thin import only, no logic
```

### AI — 2 touch points (unchanged)

```
ai/api/config.py    DEV_SKIP_AUTH config var
ai/api/api/agui.py  single bypass check
```

---

## Components

### `src/lib/dev-bypass.ts`

Single source of truth. Exports:
- `DEV_BYPASS: boolean` — `process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"`
- `DEV_WALLET: string` — `"GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R"`
- `DEV_TOKEN: string` — `"dev-bypass-token"`

Also runs **module-level pre-seeding** when `DEV_BYPASS && typeof window !== "undefined"`:
```typescript
useAuthStore.getState().setAuthState({ accessToken: DEV_TOKEN, user: {...} });
useWalletStore.getState().setWalletState({ connected: true, account: DEV_WALLET });
```

**Why module-level (not useEffect):** `AuthBootstrap` uses `ranRef` — runs exactly once on mount. Module-level code runs synchronously when the bundle loads, before any React render or effect. AuthBootstrap then sees `accessToken` already set and its own `if (accessToken) return` guard fires — skipping the `/api/auth/me` call entirely.

### `src/providers/dev-bypass-provider.tsx`

Client component. Returns children directly when `DEV_BYPASS=false` — zero overhead in production.

When `DEV_BYPASS=true`, mounts `DevBypassActive` which:

1. **Redirects `/` → `/chat`** via `useEffect` watching `pathname`
2. **Suppresses `auth:session-invalid` events** by listening in capture phase (`addEventListener(..., true)`), calling `e.stopImmediatePropagation()` before the event reaches `wallet-context.tsx`'s bubble-phase handler

Mounted inside `AppProvider`, wrapping all children.

### `proxy.ts` (middleware)

Keeps auth cookie check but adds double guard:
```typescript
if (
  process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true" &&
  process.env.NEXT_PUBLIC_APP_ENV !== "production"
) {
  return NextResponse.next();
}
```

### `layout.tsx`

Keeps the inline `<script>` tag that sets `window.__TASMIL_E2E_WALLET__` before React hydration — required because `wallet-context.tsx` reads this in its first `useEffect` to skip StellarWalletsKit init and avoid wallet sign prompts.

### `chat-page-wrapper.tsx`

Imports `DEV_BYPASS` from `@/lib/dev-bypass`. Removes the `useEffect` that injected fake token (now handled by module-level pre-seeding). Keeps thin guard:
```typescript
if (!DEV_BYPASS) {
  if (!isConnected) return <ChatAuthState mode="disconnected" .../>;
  if (!isAuthenticated) return <ChatAuthState mode="session-invalid" .../>;
}
```

Guard kept because `wallet-context`'s `isConnected` React state is `false` on first render (E2E wallet fast-path runs in `useEffect`).

---

## Files to Clean Up

| File | Action |
|---|---|
| `auth-bootstrap.tsx` | Remove `if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") return;` |
| `wallet-context.tsx` | Remove `if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") return;` |
| `landing-page/page.tsx` | Remove `if (DEV_BYPASS)` block in useEffect and the stray `return null` |
| `chat-page-wrapper.tsx` | Remove `useEffect` token injection; import `DEV_BYPASS` from lib |

---

## Production Safety

| Layer | Mechanism |
|---|---|
| Frontend env | `.env.local` is gitignored — never committed, Vercel uses dashboard env vars |
| Frontend code | `DEV_BYPASS=false` when var unset → bypass code is dead code, tree-shaken |
| AI env | `ai/.env` is gitignored — never committed, prod VM has its own `.env` |
| AI code | `DEV_SKIP_AUTH=False` (default) — prod server never has this set |
| proxy.ts | Double-checks `NEXT_PUBLIC_APP_ENV !== "production"` |

---

## Activation

**Frontend** (`tasmil-finance/.env.local`):
```
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

**AI** (`ai/.env`):
```
DEV_SKIP_AUTH=true
```

Navigate to `localhost:3000` → auto-redirects to `/chat` with mock wallet `GDQI7...3I6R`, no wallet sign required.
