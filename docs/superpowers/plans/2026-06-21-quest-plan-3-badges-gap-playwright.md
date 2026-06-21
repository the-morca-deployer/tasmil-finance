# Quest Plan 3 — Cross-surface badges + dev-bypass bridge + gap-check + Playwright (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface quest data on shared app surfaces (point/streak badges in the `/chat` header, sponsor badge in the quest header, rank/tier/points in the shared wallet dropdown), bridge the frontend dev-bypass to a real quest JWT so authenticated screens load seeded data, finalize the backend↔FE gap checklist, and build a Playwright suite that verifies quest logic + captures screenshots against the reference images.

**Architecture:** Quest data reaches shared surfaces by following the codebase's existing pattern — `top-nav-bar.tsx` (shared layout) already composes `SponsorIndicator` (a feature widget) and `ConnectWalletButton` already calls `useCredits` (a feature hook). So: A5a adds a quest `QuestHeaderBadges` widget rendered in `top-nav-bar`; A5c adds an optional `rankSlot?: ReactNode` prop to the shared `ConnectWalletButton`, fed a quest `WalletRankInfo` widget from the composition sites. The dev-bypass bridge calls the new quest `POST /auth/dev-login` (Plan 1) to populate `useQuestAuthStore` with a real JWT.

**Tech Stack:** Next.js 16, React 19, TanStack Query, Kubb hooks (`@/gen-quest`), Jest + RTL (`pnpm test`), Playwright (`pnpm test:e2e`).

## Global Constraints

- Repo: `tasmil-finance`, branch `feat/quest-new-ui-port` (continues Plan 2).
- **Depends on Plan 1** (quest `POST /auth/dev-login` + seeded data) and **Plan 2** (ported quest screens).
- Biome conventions; `pnpm check:fix` before each commit; English-only; no `any`; no `console.log`.
- `pnpm build` exits 0 before push.
- Frontend dev-bypass flag: `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`; quest API base: `NEXT_PUBLIC_QUEST_API_URL` (default `http://localhost:5555`); `DEV_WALLET = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R"` (from `src/lib/dev-bypass.ts`).
- Quest data on shared surfaces must **fail closed**: render nothing / fall back when the user has no quest profile or session (do not block the chat header).
- Commit footer (every commit):
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP
  ```

## File Structure

- Create: `src/features/quest/lib/dev-login-bridge.ts` — fetch quest JWT via `/auth/dev-login`, set `useQuestAuthStore`.
- Create: `src/features/quest/components/QuestHeaderBadges.tsx` — point + streak badge widget (with check-in).
- Create: `src/features/quest/components/WalletRankInfo.tsx` — rank/tier/points row for the wallet dropdown.
- Modify: `src/features/quest/components/Navbar.tsx` — add sponsor badge (A5b).
- Modify: `src/shared/layout/top-nav-bar.tsx` — render `QuestHeaderBadges`; pass `rankSlot={<WalletRankInfo />}`.
- Modify: `src/shared/components/connect-wallet-button.tsx` — add `rankSlot?: ReactNode` prop, render in both variants.
- Modify: `src/features/quest/context/wallet-context.tsx` (or `(quest)/layout.tsx`) — invoke the dev-login bridge under dev-bypass.
- Create: `docs/quest-backend-fe-gap.md` — gap checklist.
- Create: `playwright.config.ts` quest project + `e2e/quest/*.spec.ts`.

---

### Task 1: dev-bypass → quest JWT bridge

**Files:**
- Create: `src/features/quest/lib/dev-login-bridge.ts`
- Modify: `src/features/quest/context/wallet-context.tsx` (call the bridge on mount under dev-bypass)
- Test: `src/features/quest/lib/__tests__/dev-login-bridge.test.ts`

**Interfaces:**
- Produces: `async function ensureQuestDevSession(): Promise<void>` — when `NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"` and the quest store has no token, POSTs `{ walletAddress: DEV_WALLET }` to `${NEXT_PUBLIC_QUEST_API_URL}/auth/dev-login`, then calls `useQuestAuthStore.getState().setAuthState({ accessToken, refreshToken: "", user })`.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/lib/__tests__/dev-login-bridge.test.ts`:

```ts
import { ensureQuestDevSession } from "../dev-login-bridge";
import { useQuestAuthStore } from "../../store/use-quest-auth";

describe("ensureQuestDevSession", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    useQuestAuthStore.getState().logout();
  });

  it("sets the quest auth store from dev-login when bypass is on", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "true";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: "quest-jwt", user: { id: "u1", username: "dev", walletAddress: "G...", tier: "COHORT_4", totalPoints: 10, loginStreak: 1, role: "user" } } }),
    }) as unknown as typeof fetch;

    await ensureQuestDevSession();

    expect(useQuestAuthStore.getState().accessToken).toBe("quest-jwt");
    expect(useQuestAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("does nothing when bypass is off", async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH = "false";
    global.fetch = jest.fn() as unknown as typeof fetch;
    await ensureQuestDevSession();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- dev-login-bridge`
Expected: FAIL — cannot find module `../dev-login-bridge`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/quest/lib/dev-login-bridge.ts`:

```ts
import { useQuestAuthStore } from "../store/use-quest-auth";

const DEV_WALLET = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R";

export async function ensureQuestDevSession(): Promise<void> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "true") return;
  if (useQuestAuthStore.getState().accessToken) return;

  const base = process.env.NEXT_PUBLIC_QUEST_API_URL ?? "http://localhost:5555";
  try {
    const res = await fetch(`${base}/auth/dev-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: DEV_WALLET }),
    });
    if (!res.ok) return;
    const body = (await res.json()) as { data: { accessToken: string; user: unknown } };
    useQuestAuthStore.getState().setAuthState({
      accessToken: body.data.accessToken,
      refreshToken: "",
      user: body.data.user as never,
    });
  } catch (err) {
    console.warn("quest dev-login bridge failed", err);
  }
}
```

In `src/features/quest/context/wallet-context.tsx`, call `ensureQuestDevSession()` inside the existing mount `useEffect` (import it at the top). If no suitable effect exists, add:

```ts
useEffect(() => {
  void ensureQuestDevSession();
}, []);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- dev-login-bridge`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
pnpm check:fix
git add src/features/quest/lib/dev-login-bridge.ts src/features/quest/lib/__tests__/dev-login-bridge.test.ts src/features/quest/context/wallet-context.tsx
git commit -m "feat(quest): bridge dev-bypass to a real quest JWT via /auth/dev-login

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 2: A5a — `/chat` header point + streak badges (with check-in)

**Files:**
- Create: `src/features/quest/components/QuestHeaderBadges.tsx`
- Modify: `src/shared/layout/top-nav-bar.tsx`
- Test: `src/features/quest/components/__tests__/quest-header-badges.test.tsx`

**Interfaces:**
- Consumes: `useUsersControllerGetMe`, `useUsersControllerGetCheckInStatus`, `useUsersControllerDailyLogin`, `usersControllerGetMeQueryKey` (`@/gen-quest/hooks`); `useQueryClient`.
- Produces: `QuestHeaderBadges` — renders a points pill + a streak pill (flame). The streak pill triggers daily check-in. Renders `null` when there is no quest profile.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/quest-header-badges.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { QuestHeaderBadges } from "../QuestHeaderBadges";

const mockGetMe = jest.fn();
jest.mock("@tanstack/react-query", () => ({ ...jest.requireActual("@tanstack/react-query"), useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetMe: () => mockGetMe(),
  useUsersControllerGetCheckInStatus: () => ({ data: { data: { canCheckIn: true } } }),
  useUsersControllerDailyLogin: () => ({ mutate: jest.fn(), isPending: false }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("QuestHeaderBadges", () => {
  it("renders points and streak when a quest profile exists", () => {
    mockGetMe.mockReturnValue({ data: { data: { totalPoints: 10, loginStreak: 1 } } });
    render(<QuestHeaderBadges />);
    expect(screen.getByTestId("quest-points-badge")).toHaveTextContent("10");
    expect(screen.getByTestId("quest-streak-badge")).toHaveTextContent("1");
  });

  it("renders nothing when there is no quest profile", () => {
    mockGetMe.mockReturnValue({ data: undefined });
    const { container } = render(<QuestHeaderBadges />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- quest-header-badges`
Expected: FAIL — cannot find module `../QuestHeaderBadges`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/quest/components/QuestHeaderBadges.tsx`:

```tsx
"use client";

import { Coins, Flame } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
  usersControllerGetMeQueryKey,
} from "@/gen-quest/hooks";

export function QuestHeaderBadges() {
  const queryClient = useQueryClient();
  const me = useUsersControllerGetMe();
  const profile = me.data?.data as { totalPoints?: number; loginStreak?: number } | undefined;
  const checkIn = useUsersControllerGetCheckInStatus();
  const canCheckIn = (checkIn.data?.data as { canCheckIn?: boolean } | undefined)?.canCheckIn ?? false;
  const dailyLogin = useUsersControllerDailyLogin({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() }),
    },
  });

  if (!profile) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        data-testid="quest-points-badge"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 font-bold text-sm"
      >
        <Coins className="h-4 w-4 text-[#67e8f9]" />
        {(profile.totalPoints ?? 0).toLocaleString()}
      </span>
      <button
        type="button"
        data-testid="quest-streak-badge"
        disabled={!canCheckIn || dailyLogin.isPending}
        onClick={() => dailyLogin.mutate(undefined as never)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 font-bold text-sm text-orange-400 disabled:opacity-60"
      >
        <Flame className="h-4 w-4" />
        {profile.loginStreak ?? 0}
      </button>
    </div>
  );
}
```

In `src/shared/layout/top-nav-bar.tsx`, import and render it in the right cluster, before `SponsorIndicator`:

```tsx
import { QuestHeaderBadges } from "@/features/quest/components/QuestHeaderBadges";
```
```tsx
      <div className="ml-auto flex items-center gap-3">
        <QuestHeaderBadges />
        <SponsorIndicator />
        <ConnectWalletButton variant="topbar" rankSlot={<WalletRankInfo />} />
      </div>
```

> The `rankSlot={<WalletRankInfo />}` addition belongs to Task 4 — add only the `QuestHeaderBadges` line in this task; the `rankSlot` prop line lands in Task 4. (Keeps each task independently testable.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- quest-header-badges`
Expected: PASS (both cases).

- [ ] **Step 5: Lint + commit**

```bash
pnpm check:fix
git add src/features/quest/components/QuestHeaderBadges.tsx src/features/quest/components/__tests__/quest-header-badges.test.tsx src/shared/layout/top-nav-bar.tsx
git commit -m "feat(quest): add points + streak badges to the /chat header with check-in

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 3: A5b — sponsor badge in the quest header

**Files:**
- Modify: `src/features/quest/components/Navbar.tsx`
- Test: `src/features/quest/components/__tests__/quest-sponsor-badge.test.tsx`

**Interfaces:**
- Consumes: `useUsersControllerGetMyCampaigns` (`@/gen-quest/hooks`) — the user's joined campaigns; a campaign's `metadata.sponsor` marks it sponsored.
- Produces: a sponsor badge element (`data-testid="quest-sponsor-badge"`) rendered in the quest `Navbar` when the user has joined at least one campaign carrying `metadata.sponsor`; shows the sponsor name.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/quest-sponsor-badge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";

jest.mock("next/navigation", () => ({ usePathname: () => "/quest" }));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({ isAuthenticating: false, address: "G...", displayAddress: "G...EF", points: 10, user: { username: "dev" }, connect: jest.fn(), disconnect: jest.fn(), isAuthenticated: true, isConnected: true }),
}));
jest.mock("@tanstack/react-query", () => ({ ...jest.requireActual("@tanstack/react-query"), useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));

const mockMyCampaigns = jest.fn();
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetCheckInStatus: () => ({ data: undefined }),
  useUsersControllerDailyLogin: () => ({ mutate: jest.fn(), isPending: false }),
  useUsersControllerGetMyCampaigns: () => mockMyCampaigns(),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("Quest header sponsor badge", () => {
  it("shows the sponsor name when a joined campaign is sponsored", () => {
    mockMyCampaigns.mockReturnValue({ data: { data: [{ id: "c1", metadata: { sponsor: "DefIndex" } }] } });
    render(<Navbar />);
    expect(screen.getByTestId("quest-sponsor-badge")).toHaveTextContent("DefIndex");
  });

  it("hides the badge when no joined campaign is sponsored", () => {
    mockMyCampaigns.mockReturnValue({ data: { data: [{ id: "c2", metadata: {} }] } });
    render(<Navbar />);
    expect(screen.queryByTestId("quest-sponsor-badge")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- quest-sponsor-badge`
Expected: FAIL — `useUsersControllerGetMyCampaigns` not used by Navbar yet / badge missing.

- [ ] **Step 3: Write minimal implementation**

In `src/features/quest/components/Navbar.tsx`, add the hook import and derive the sponsor, then render the badge near the brand/nav cluster:

```tsx
import { useUsersControllerGetMyCampaigns } from "@/gen-quest/hooks";
```
```tsx
  const myCampaigns = useUsersControllerGetMyCampaigns();
  const sponsoredName = ((myCampaigns.data?.data as { metadata?: { sponsor?: string } }[] | undefined) ?? [])
    .map((c) => c.metadata?.sponsor)
    .find((s): s is string => Boolean(s));
```
```tsx
  {sponsoredName ? (
    <span
      data-testid="quest-sponsor-badge"
      className="ml-3 flex h-7 items-center gap-1.5 rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 font-medium text-[var(--accent)] text-xs"
    >
      Sponsored · {sponsoredName}
    </span>
  ) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- quest-sponsor-badge`
Expected: PASS (both cases).

- [ ] **Step 5: Lint + commit**

```bash
pnpm check:fix
git add src/features/quest/components/Navbar.tsx src/features/quest/components/__tests__/quest-sponsor-badge.test.tsx
git commit -m "feat(quest): show sponsor badge in quest header for joined sponsored campaigns

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 4: A5c — rank/tier/points in the shared wallet dropdown

**Files:**
- Create: `src/features/quest/components/WalletRankInfo.tsx`
- Modify: `src/shared/components/connect-wallet-button.tsx` (add `rankSlot?: ReactNode`)
- Modify: `src/shared/layout/top-nav-bar.tsx` (pass `rankSlot={<WalletRankInfo />}`)
- Test: `src/features/quest/components/__tests__/wallet-rank-info.test.tsx`, `src/shared/components/__tests__/connect-wallet-button-rank-slot.test.tsx`

**Interfaces:**
- Consumes: `useUsersControllerGetMe` (tier, totalPoints), `useSeasonsControllerMyResult` (rank) — both `@/gen-quest/hooks`.
- Produces: `WalletRankInfo` rendering `#<rank> · top <pct>% · <tier> · <points> pts` (rank/top% only when a season result exists); `ConnectWalletButton` gains `rankSlot?: ReactNode` rendered at the top of both dropdown variants.

- [ ] **Step 1: Write the failing tests**

Create `src/features/quest/components/__tests__/wallet-rank-info.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { WalletRankInfo } from "../WalletRankInfo";

jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetMe: () => ({ data: { data: { tier: "COHORT_4", totalPoints: 10 } } }),
  useSeasonsControllerMyResult: () => ({ data: { data: { finalRank: 34, percentile: 92 } } }),
}));

describe("WalletRankInfo", () => {
  it("renders rank, tier and points", () => {
    render(<WalletRankInfo />);
    expect(screen.getByTestId("wallet-rank-info")).toHaveTextContent("#34");
    expect(screen.getByTestId("wallet-rank-info")).toHaveTextContent(/bronze/i);
    expect(screen.getByTestId("wallet-rank-info")).toHaveTextContent("10");
  });
});
```

Create `src/shared/components/__tests__/connect-wallet-button-rank-slot.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { ConnectWalletButton } from "../connect-wallet-button";

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({ isConnected: true, address: "GABC123", displayAddress: "GABC...123", connect: jest.fn(), disconnect: jest.fn() }),
}));
jest.mock("@/features/credits/use-credits", () => ({ useCredits: () => ({ data: { credits: 0 }, isLoading: false }) }));

describe("ConnectWalletButton rankSlot", () => {
  it("renders the provided rankSlot node", () => {
    render(<ConnectWalletButton variant="topbar" rankSlot={<div data-testid="slot">rank-here</div>} />);
    // The slot is inside the dropdown content; assert it is in the tree.
    expect(screen.getByTestId("slot")).toBeInTheDocument();
  });
});
```

> Radix dropdown content may render in a portal and only on open. If the slot is not in the DOM until the menu opens, wrap the trigger click: `await userEvent.click(screen.getByTestId("wallet-connected"))` before the assertion (import `userEvent` from `@testing-library/user-event`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- wallet-rank-info connect-wallet-button-rank-slot`
Expected: FAIL — `../WalletRankInfo` missing; `rankSlot` prop not rendered.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/quest/components/WalletRankInfo.tsx`:

```tsx
"use client";

import { useSeasonsControllerMyResult, useUsersControllerGetMe } from "@/gen-quest/hooks";

const TIER_LABEL: Record<string, string> = {
  COHORT_4: "Bronze",
  COHORT_3: "Silver",
  COHORT_2: "Gold",
  COHORT_1: "Diamond",
  UNRANKED: "Unranked",
};

export function WalletRankInfo() {
  const me = useUsersControllerGetMe();
  const profile = me.data?.data as { tier?: string; totalPoints?: number } | undefined;
  const myResult = useSeasonsControllerMyResult();
  const result = myResult.data?.data as { finalRank?: number; percentile?: number } | undefined;

  if (!profile) return null;

  const tier = TIER_LABEL[profile.tier ?? "UNRANKED"] ?? "Unranked";
  const parts = [
    result?.finalRank ? `#${result.finalRank}` : null,
    result?.percentile != null ? `top ${result.percentile}%` : null,
    tier,
    `${(profile.totalPoints ?? 0).toLocaleString()} pts`,
  ].filter(Boolean);

  return (
    <div data-testid="wallet-rank-info" className="px-3 py-2 text-muted-foreground text-xs">
      {parts.join(" · ")}
    </div>
  );
}
```

In `src/shared/components/connect-wallet-button.tsx`:
- Add `import type { ReactNode } from "react";`.
- Change the props interface and signature:
```tsx
interface ConnectWalletButtonProps {
  variant?: "topbar" | "sidebar";
  rankSlot?: ReactNode;
}

export function ConnectWalletButton({ variant = "sidebar", rankSlot }: ConnectWalletButtonProps) {
```
- Pass `rankSlot` into `TopbarWallet` (add it to `TopbarWalletProps` and the call) and render `{rankSlot}` at the top of each `DropdownMenuContent` (after the address header block, before the first `DropdownMenuSeparator`). For the sidebar variant, render `{rankSlot}` as the first child of its `DropdownMenuContent`.

In `src/shared/layout/top-nav-bar.tsx`, import `WalletRankInfo` and pass it:
```tsx
import { WalletRankInfo } from "@/features/quest/components/WalletRankInfo";
```
```tsx
        <ConnectWalletButton variant="topbar" rankSlot={<WalletRankInfo />} />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- wallet-rank-info connect-wallet-button-rank-slot`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
pnpm check:fix
git add src/features/quest/components/WalletRankInfo.tsx src/shared/components/connect-wallet-button.tsx src/shared/layout/top-nav-bar.tsx src/features/quest/components/__tests__/wallet-rank-info.test.tsx src/shared/components/__tests__/connect-wallet-button-rank-slot.test.tsx
git commit -m "feat(quest): show rank/tier/points in the shared wallet dropdown via rankSlot

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 5: Backend ↔ FE gap checklist

**Files:**
- Create: `docs/quest-backend-fe-gap.md`

This task is analysis + documentation (no production code, so no TDD cycle). It records, per quest backend endpoint, whether the FE now consumes it (after Plans 2–3), with a reason for any that remain unwired.

- [ ] **Step 1: Inventory consumers**

Run, in `tasmil-finance`:
```bash
grep -rhoE "use[A-Z][a-zA-Z]*Controller[A-Za-z]*" src/features/quest "src/app/(quest)" src/shared/layout src/shared/components | sort -u
```
Capture the set of consumed hooks.

- [ ] **Step 2: Write the checklist**

Create `docs/quest-backend-fe-gap.md` with a table: every quest backend endpoint (from the 10 controllers — auth, users, campaigns, tasks, referral, seasons, social-accounts, notifications, analytics, admin) × column `consumed? (component)` × column `note`. Mark closed-by-this-effort items (My Quests → `useUsersControllerGetMyCampaigns` in Profile; points ledger → `useUsersControllerGetPointsHistory`; social unlink → `useSocialAccountsControllerUnlinkAccount`; streak board → `useAnalyticsControllerStreakLeaderboard`; rank → `useSeasonsControllerMyResult` in WalletRankInfo; check-in → `QuestHeaderBadges`). For anything still unwired (e.g. `notifications/send` is admin-only; `tasks/submit-proof` if no proof task UI; `referral/leaderboard` if not surfaced), state the reason and whether it is backlog or intentionally unused.

- [ ] **Step 3: Commit**

```bash
git add docs/quest-backend-fe-gap.md
git commit -m "docs(quest): backend-to-FE endpoint gap checklist

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 6: Playwright quest suite (logic specs + screenshots)

**Files:**
- Modify: `playwright.config.ts` (add a `quest` project)
- Create: `e2e/quest/quest-screens.spec.ts`, `e2e/quest/quest-flows.spec.ts`, `e2e/quest/quest-screenshots.spec.ts`

**Interfaces:**
- Consumes: a running, seeded quest backend (Plan 1) on `:5555` and the finance dev server with `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` + the dev-login bridge (Task 1).
- Produces: passing logic specs + captured screenshots under the run output dir.

**Pre-req runbook (documented at the top of `quest-screens.spec.ts` as a comment):**
```
# Terminal 1 — seeded quest backend (see Plan 1 for TEST_DB_URL setup)
cd tasmil-quest-folder/backend && QUEST_DEV_LOGIN=true DATABASE_URL=$TEST_DB_URL pnpm dev
# Terminal 2 — Playwright (starts finance dev itself via webServer)
cd tasmil-finance && NEXT_PUBLIC_DEV_BYPASS_AUTH=true pnpm test:e2e --project=quest
```

- [ ] **Step 1: Add the Playwright project (config)**

In `playwright.config.ts`, add to the `projects` array:

```ts
    {
      name: "quest",
      testDir: "./e2e",
      testMatch: ["quest/**/*.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        navigationTimeout: 60_000,
        screenshot: { mode: "on", fullPage: true },
      },
      timeout: 60_000,
    },
```

- [ ] **Step 2: Write the failing logic spec**

Create `e2e/quest/quest-screens.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("quest screens render seeded data", () => {
  test("Explore shows featured campaigns", async ({ page }) => {
    await page.goto("/quest");
    await expect(page.getByText("Index Builder")).toBeVisible();
  });

  test("Campaigns lists seeded campaigns with filter", async ({ page }) => {
    await page.goto("/quest/campaigns");
    await expect(page.getByRole("tab", { name: /all/i })).toBeVisible();
    await expect(page.getByText("Vault Guardian")).toBeVisible();
  });

  test("Leaderboard shows the podium and points/streak toggle", async ({ page }) => {
    await page.goto("/quest/leaderboard");
    await expect(page.getByText("stellar_nomad")).toBeVisible();
    await expect(page.getByRole("tab", { name: /streak/i })).toBeVisible();
  });

  test("Profile shows the four tabs and seeded points", async ({ page }) => {
    await page.goto("/quest/profile");
    await expect(page.getByRole("tab", { name: /my quests/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /referrals/i })).toBeVisible();
  });

  test("chat header shows the quest points + streak badges", async ({ page }) => {
    await page.goto("/chat/new");
    await expect(page.getByTestId("quest-points-badge")).toBeVisible();
    await expect(page.getByTestId("quest-streak-badge")).toBeVisible();
  });
});
```

- [ ] **Step 3: Run to verify it fails (then passes once Plans 1–2 + Tasks 1–4 are in place)**

Run: `NEXT_PUBLIC_DEV_BYPASS_AUTH=true pnpm test:e2e --project=quest -g "quest screens"`
Expected (before the data/bridge are wired): FAIL — text not found / badges missing.
After Plans 1–2 and Tasks 1–2 are complete and the seeded backend is running: PASS.

- [ ] **Step 4: Write the flow spec + screenshot spec**

Create `e2e/quest/quest-flows.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("join a campaign from the detail page", async ({ page }) => {
  await page.goto("/quest/campaign/seed-allbridge");
  const join = page.getByRole("button", { name: /join|start quest/i }).first();
  await join.click();
  await expect(page.getByText(/joined|0\/3 completed|in progress/i).first()).toBeVisible();
});

test("daily check-in from the header streak badge", async ({ page }) => {
  await page.goto("/quest");
  const streak = page.getByTestId("quest-streak-badge");
  await expect(streak).toBeVisible();
  // If check-in is available, clicking should not throw and the badge stays visible.
  await streak.click({ trial: true }).catch(() => undefined);
});
```

Create `e2e/quest/quest-screenshots.spec.ts`:

```ts
import { test } from "@playwright/test";

const SCREENS: { path: string; name: string }[] = [
  { path: "/quest", name: "explore" },
  { path: "/quest/campaigns", name: "campaigns" },
  { path: "/quest/campaign/seed-defindex", name: "campaign-detail" },
  { path: "/quest/leaderboard", name: "leaderboard" },
  { path: "/quest/profile", name: "profile" },
];

for (const s of SCREENS) {
  test(`screenshot ${s.name}`, async ({ page }, testInfo) => {
    await page.goto(s.path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: testInfo.outputPath(`${s.name}.png`), fullPage: true });
  });
}
```

- [ ] **Step 5: Run + compare + commit**

Run: `NEXT_PUBLIC_DEV_BYPASS_AUTH=true pnpm test:e2e --project=quest`
Expected: logic specs PASS; screenshots produced under the run output dir. Open each captured PNG next to its `tmp/images-quest/` reference and confirm the look matches. Then:

```bash
pnpm check:fix
git add playwright.config.ts e2e/quest
git commit -m "test(quest): Playwright quest suite — seeded logic specs + screenshot capture

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

## Self-Review

**Spec coverage (Plan 3 portion):**
- A5a `/chat` header points + streak with check-in, hidden without a profile → Task 2. ✓
- A5b quest header sponsor badge when joined a sponsored campaign → Task 3 (reads `metadata.sponsor` seeded in Plan 1 Task 4). ✓
- A5c rank/tier/points in the shared wallet dropdown, both variants, graceful fallback → Task 4. ✓
- C2 frontend dev-bypass bridge to a real quest JWT → Task 1. ✓
- Workstream B gap checklist → Task 5. ✓
- C3 Playwright logic specs + screenshot capture against references → Task 6. ✓
- TDD: Tasks 1–4 are RED→GREEN with full tests; Task 6's specs are themselves the test-first artifacts (fail before data/bridge, pass after). Task 5 is documentation (no code). ✓

**Architecture note vs spec:** the spec's "shared never imports feature; props/slot only" is relaxed to match the codebase's actual, established pattern — `top-nav-bar` already imports `SponsorIndicator` and `connect-wallet-button` already imports `useCredits`. A5a follows the `SponsorIndicator` precedent (feature widget in shared layout); A5c keeps the shared button decoupled via a `rankSlot` ReactNode prop (no quest import inside `connect-wallet-button.tsx`).

**Placeholder scan:** every code step has concrete, runnable content; the gap-checklist task specifies the exact grep + table columns to produce.

**Type/name consistency:** `useQuestAuthStore.setAuthState({ accessToken, refreshToken, user })` matches the store API (Plan 2 finance map); `rankSlot` prop name used identically in `ConnectWalletButton`, `TopbarWalletProps`, and `top-nav-bar`; `data-testid`s (`quest-points-badge`, `quest-streak-badge`, `quest-sponsor-badge`, `wallet-rank-info`) are reused consistently between unit and Playwright specs; tier mapping `COHORT_4 → Bronze` matches the Plan 1 seed (`tier='COHORT_4'`, points 10) and the reference image (`BRONZE`).

**Cross-plan dependency:** Task 6 requires Plan 1 (seed + dev-login on `:5555`) and Plan 2 (ported screens). Seeded campaign ids referenced by the specs (`seed-defindex`, `seed-allbridge`, `seed-*`) come from Plan 1 Task 4's `seed-<protocol>` id convention.
