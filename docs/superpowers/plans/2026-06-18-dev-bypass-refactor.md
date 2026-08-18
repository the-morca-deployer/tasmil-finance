# Dev Bypass Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize dev bypass logic from 9 scattered files into 4 well-defined touch points with zero production impact.

**Architecture:** A `dev-bypass.ts` lib file exports constants and runs module-level Zustand store pre-seeding synchronously at bundle load time. A `DevBypassProvider` client component handles redirect and event suppression. Files that previously held raw env checks are cleaned up to use the lib or the provider.

**Tech Stack:** Next.js 16 App Router, Zustand, TypeScript, React

---

### Task 1: Create `src/lib/dev-bypass.ts`

**Files:**
- Create: `tasmil-finance/src/lib/dev-bypass.ts`

- [ ] **Step 1: Create the file**

```typescript
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

export const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
export const DEV_WALLET = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R";
export const DEV_TOKEN = "dev-bypass-token";

if (DEV_BYPASS && typeof window !== "undefined") {
  useAuthStore.getState().setAuthState({
    accessToken: DEV_TOKEN,
    user: {
      id: "dev-user",
      walletAddress: DEV_WALLET,
      type: "guest",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  useWalletStore.getState().setWalletState({ connected: true, account: DEV_WALLET });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors related to `src/lib/dev-bypass.ts`

- [ ] **Step 3: Commit**

```bash
cd tasmil-finance
git add src/lib/dev-bypass.ts
git commit -m "feat: add dev-bypass lib with constants and module-level store pre-seeding"
```

---

### Task 2: Create `src/providers/dev-bypass-provider.tsx`

**Files:**
- Create: `tasmil-finance/src/providers/dev-bypass-provider.tsx`

- [ ] **Step 1: Create the file**

```typescript
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEV_BYPASS } from "@/lib/dev-bypass";

function DevBypassActive({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect / → /chat
  useEffect(() => {
    if (pathname === "/") {
      router.replace("/chat");
    }
  }, [pathname, router]);

  // Suppress auth:session-invalid before it reaches wallet-context's bubble-phase handler
  useEffect(() => {
    const suppress = (e: Event) => {
      e.stopImmediatePropagation();
    };
    window.addEventListener("auth:session-invalid", suppress, true);
    return () => window.removeEventListener("auth:session-invalid", suppress, true);
  }, []);

  return <>{children}</>;
}

export function DevBypassProvider({ children }: { children: React.ReactNode }) {
  if (!DEV_BYPASS) return <>{children}</>;
  return <DevBypassActive>{children}</DevBypassActive>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd tasmil-finance
git add src/providers/dev-bypass-provider.tsx
git commit -m "feat: add DevBypassProvider for redirect and session-invalid suppression"
```

---

### Task 3: Mount `DevBypassProvider` in `app-provider.tsx`

**Files:**
- Modify: `tasmil-finance/src/providers/app-provider.tsx`

- [ ] **Step 1: Read the file**

```bash
cat -n tasmil-finance/src/providers/app-provider.tsx
```

- [ ] **Step 2: Add import and wrap children**

Find the import block and add:
```typescript
import { DevBypassProvider } from "./dev-bypass-provider";
```

Find the return JSX. Current structure is roughly:
```tsx
<WalletProvider>
  <OnboardingProvider>
    {children}
  </OnboardingProvider>
</WalletProvider>
```

Change to:
```tsx
<WalletProvider>
  <DevBypassProvider>
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  </DevBypassProvider>
</WalletProvider>
```

`DevBypassProvider` must be inside `WalletProvider` (so `usePathname`/`useRouter` are available) and outside `OnboardingProvider` (so redirect happens before onboarding logic runs).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance
git add src/providers/app-provider.tsx
git commit -m "feat: mount DevBypassProvider in AppProvider"
```

---

### Task 4: Update `proxy.ts` with double-guard

**Files:**
- Modify: `tasmil-finance/src/proxy.ts`

- [ ] **Step 1: Read the file**

```bash
cat -n tasmil-finance/src/proxy.ts
```

- [ ] **Step 2: Replace the bypass check**

Find the current bypass block (single env check):
```typescript
if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
  return NextResponse.next();
}
```

Replace with double-guard:
```typescript
if (
  process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true" &&
  process.env.NEXT_PUBLIC_APP_ENV !== "production"
) {
  return NextResponse.next();
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance
git add src/proxy.ts
git commit -m "fix: add production env double-guard to proxy.ts bypass check"
```

---

### Task 5: Update `chat-page-wrapper.tsx`

**Files:**
- Modify: `tasmil-finance/src/features/chat/components/chat-page-wrapper.tsx`

- [ ] **Step 1: Read the file**

```bash
cat -n tasmil-finance/src/features/chat/components/chat-page-wrapper.tsx
```

- [ ] **Step 2: Update imports and remove inline constants + useEffect**

Replace the top of the file:
```typescript
"use client";

import { useEffect } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";
import { ChatProvider } from "../providers";
import { ChatAuthState } from "./chat-auth-state";
import { ChatClient } from "./chat-client";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
const DEV_WALLET = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R";
```

With:
```typescript
"use client";

import { useWallet } from "@/shared/context/wallet-context";
import { useAuthStore } from "@/store/use-auth";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import { ChatProvider } from "../providers";
import { ChatAuthState } from "./chat-auth-state";
import { ChatClient } from "./chat-client";
```

Remove the entire `useEffect` block that injects fake token and wallet state (the module-level pre-seeding in `dev-bypass.ts` handles this now). Keep the `if (!DEV_BYPASS)` guard and the rest of the component unchanged:

```typescript
export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  const { isConnected, connectWalletOnly, forceReauth } = useWallet();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!DEV_BYPASS) {
    if (!isConnected) {
      return <ChatAuthState mode="disconnected" onConnect={() => void connectWalletOnly()} />;
    }
    if (!isAuthenticated) {
      return <ChatAuthState mode="session-invalid" onReconnect={() => void forceReauth()} />;
    }
  }

  const initialThreadId = chatId === "new" ? undefined : chatId;

  return (
    <ChatProvider key={chatId} agentId={agentId} chatId={initialThreadId}>
      <ChatClient agentId={agentId} chatId={chatId} />
    </ChatProvider>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance
git add src/features/chat/components/chat-page-wrapper.tsx
git commit -m "refactor: import DEV_BYPASS from lib, remove inline useEffect token injection"
```

---

### Task 6: Remove bypass check from `auth-bootstrap.tsx`

**Files:**
- Modify: `tasmil-finance/src/shared/context/auth-bootstrap.tsx`

- [ ] **Step 1: Read the file**

```bash
cat -n tasmil-finance/src/shared/context/auth-bootstrap.tsx
```

- [ ] **Step 2: Remove the bypass early return**

Find and remove:
```typescript
if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") return;
```

This early return is no longer needed because the module-level pre-seeding in `dev-bypass.ts` sets `accessToken` before any React render. AuthBootstrap's own `if (accessToken) return;` guard then fires - skipping the `/api/auth/me` call without needing a separate bypass check.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance
git add src/shared/context/auth-bootstrap.tsx
git commit -m "refactor: remove bypass check from auth-bootstrap (module-level pre-seeding handles it)"
```

---

### Task 7: Remove bypass check from `wallet-context.tsx`

**Files:**
- Modify: `tasmil-finance/src/shared/context/wallet-context.tsx`

- [ ] **Step 1: Read the file and locate the bypass check**

```bash
grep -n "DEV_BYPASS\|dev_bypass\|BYPASS" tasmil-finance/src/shared/context/wallet-context.tsx
```

- [ ] **Step 2: Remove the bypass early return inside auth:session-invalid handler**

Find and remove the line:
```typescript
if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") return;
```

This is handled by `DevBypassProvider`'s capture-phase listener that calls `e.stopImmediatePropagation()` before the event reaches wallet-context's bubble-phase handler.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance
git add src/shared/context/wallet-context.tsx
git commit -m "refactor: remove bypass check from wallet-context (DevBypassProvider suppresses event)"
```

---

### Task 8: Clean `landing-page/page.tsx`

**Files:**
- Modify: `tasmil-finance/src/app/(landing-page)/page.tsx`

- [ ] **Step 1: Read the file**

```bash
cat -n "tasmil-finance/src/app/(landing-page)/page.tsx"
```

- [ ] **Step 2: Remove the bypass block from useEffect**

Find the useEffect that contains the bypass redirect:
```typescript
useEffect(() => {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    router.replace("/chat");
    return;
  }
  // ... rest of landing logic
}, [...]);
```

Remove only the `if (DEV_BYPASS)` block from the useEffect. Keep all other landing page logic intact. The redirect is now handled by `DevBypassProvider`.

Also remove any `import` of DEV_BYPASS or `process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH` that is no longer referenced.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance
git add "src/app/(landing-page)/page.tsx"
git commit -m "refactor: remove bypass redirect from landing page (DevBypassProvider handles it)"
```

---

### Task 9: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Ensure `.env.local` has bypass enabled**

```bash
grep NEXT_PUBLIC_DEV_BYPASS_AUTH tasmil-finance/.env.local
```

Expected: `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`

- [ ] **Step 2: Start the dev server**

```bash
cd tasmil-finance && pnpm dev
```

- [ ] **Step 3: Navigate to localhost:3000**

Expected behavior:
1. Auto-redirects to `/chat`
2. Mock wallet `GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R` shows in header
3. No wallet sign prompt
4. No "Session issue" toast
5. Chat input is functional

- [ ] **Step 4: Verify no Network calls to `/api/auth/me`**

Open browser DevTools → Network tab. Reload page. Confirm no request to `/api/auth/me`.

- [ ] **Step 5: Run lint**

```bash
cd tasmil-finance && pnpm check:fix
```

Expected: exit 0

- [ ] **Step 6: Run type-check**

```bash
cd tasmil-finance && pnpm type-check
```

Expected: exit 0

- [ ] **Step 7: Final commit if any lint fixes were applied**

```bash
cd tasmil-finance
git add -p
git commit -m "chore: apply lint/format fixes from dev-bypass refactor"
```
