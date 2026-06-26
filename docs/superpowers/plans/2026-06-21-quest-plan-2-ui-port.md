# Quest Plan 2 — Port new-ui UI into tasmil-finance (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the `tasmil-quest-frontend@origin/new-ui` look into `tasmil-finance/src/features/quest/`, screen by screen, rewired to the finance data/auth layer and `/quest/*` routing, pixel-faithful to the reference screenshots in `tmp/images-quest/`.

**Architecture:** The current quest UI inside `tasmil-finance` is **visually broken** — this port **fully replaces** it (stylesheet + components) with the `new-ui` versions, not a delta-merge. The two sides share the same component model, the same Kubb-generated hooks (`gen` vs `gen-quest`, identical hook names), the same `useWallet()` shape, and the same UI primitives, so each replacement is mechanical: overwrite the finance file with the new-ui source, apply a fixed **Porting Substitution Table**, rewrite root links to `/quest/*`, and confirm behavior with a Jest/RTL test plus a screenshot comparison. The full new-ui stylesheet (design tokens + component classes) is ported wholesale into `quest.css` first (Task 1). Visual fidelity is verified by eye against the reference images (no pixel-threshold gate).

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Kubb hooks (`@/gen-quest`), framer-motion 12, lucide-react, Radix UI, Biome, Jest + React Testing Library (`pnpm test`).

## Global Constraints

- Repo: `tasmil-finance` (GitHub `Tasmil-Finance/tasmil-finance`). Branch `feat/quest-new-ui-port` (already created, cut from `deploy/staging`).
- Feature isolation: code stays in `src/features/quest/`; never import another feature; import shared via `@/shared` or props. Consume quest symbols via the feature barrel where existing code does.
- Biome: 2-space indent, line width 100, double quotes, `import type` for type-only imports, no `any`, no `console.log` (use `console.warn`/`console.error`). Run `pnpm check:fix` before each commit.
- English-only strings.
- All deps already present (framer-motion ^12, lucide-react ^0.562, radix, class-variance-authority, tailwind-merge) — **no installs**.
- `pnpm build` must exit 0 before any push (memory: build-before-push).
- Pixel reference: `tmp/images-quest/` (see the spec's reference table). Compare each ported screen to its image before marking the task done.
- Commit footer (every commit):
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP
  ```

## Porting Substitution Table (apply to EVERY ported file)

When copying a file from `git show origin/new-ui:<path>` (in `tasmil-quest-folder/frontend`) into `tasmil-finance/src/features/quest/...`, replace imports left → right:

| new-ui import | finance import |
|---|---|
| `@/gen/hooks` and `@/gen/hooks/<cat>-hooks/<file>` | `@/gen-quest/hooks` |
| `@/context/WalletContext` (`useWallet`, `WalletProvider`) | `@/features/quest/context/wallet-context` |
| `@/store/use-auth` (`useAuthStore`) | `@/features/quest/store/use-quest-auth` (`useQuestAuthStore`) — **also rename the identifier** `useAuthStore` → `useQuestAuthStore` |
| `@/lib/kubb-config` (`$`, `$live`, `withAuth`) | `@/features/quest/lib/kubb-config` |
| `@/utils/campaign-mapper` | `@/features/quest/lib/campaign-mapper` |
| `@/components/ui/<x>` | `@/features/quest/components/ui/<x>` |
| `@/components/quest/<x>` | `@/features/quest/components/<x>` (finance keeps quest components flat under `components/`) |
| `@/components/<PageOrWidget>` (Navbar, Footer, Rise, TFLoader, TelegramButton) | `@/features/quest/components/<PageOrWidget>` |
| `@/lib/utils` (`cn`) | the same `cn` import used by `src/features/quest/components/ui/button.tsx` (match the existing file) |

**Link rewrites (in every ported file's JSX `href`/`router.push`):**

| new-ui path | finance path |
|---|---|
| `/` | `/quest` |
| `/campaigns` | `/quest/campaigns` |
| `/leaderboard` | `/quest/leaderboard` |
| `/profile` | `/quest/profile` |
| `/campaign/${id}` | `/quest/campaign/${id}` |

**Do NOT port** new-ui's `WalletProvider` wrapper or `AutoReconnect` into pages — the finance `(quest)/layout.tsx` already provides `WalletProvider` + `AutoReconnect`. Strip any `<WalletProvider>` wrapper from ported page components.

**Tokens & CSS:** Because the existing finance quest UI is broken, do **not** trust the current `quest.css` — Task 1 ports the **entire** new-ui stylesheet (the `globals.css @theme` token block + the `quest.css` component classes) into `src/features/quest/quest.css`, all scoped under `.quest-scope`. The new-ui `@theme` token names (`--color-accent` …) are rewritten to the `.quest-scope` names finance components expect (`--accent` …) — mapping table in Task 1.

---

## File Structure

- Replace: `src/features/quest/quest.css` — full new-ui stylesheet (tokens + component classes), scoped to `.quest-scope`.

Ported/replaced under `src/features/quest/components/`:
- Presentational sub-components (new or replaced): `Podium.tsx`, `LeaderboardRow.tsx`, `RankMove.tsx`, `StatRing.tsx`, `LedgerRow.tsx`, `QuestStep.tsx`, `CampaignCard.tsx`, `SocialConnectCard.tsx`, `Rise.tsx`, `TFLoader.tsx`, `ui/typography.tsx` (if missing).
- Screen components (replaced): `Explore.tsx`, `Campaigns.tsx`, `CampaignDetail.tsx`, `Leaderboard.tsx` (new file; replaces `leaderboard-page.tsx` usage), `Profile.tsx`, `Navbar.tsx`, `Footer.tsx`.
- Retired after migration: `leaderboard-table.tsx`, `season-podium.tsx`, `podium-card.tsx` (only if no remaining importers).
- Barrel: `src/features/quest/index.ts` (re-point exports).
- Routes: `src/app/(quest)/*/page.tsx` (ensure each renders the ported component).

---

### Task 1: Foundation — full stylesheet + presentational sub-components

**Files:**
- Replace: `src/features/quest/quest.css` (port the entire new-ui stylesheet; the existing one is broken).
- Create/replace: `src/features/quest/components/{Rise,TFLoader,Podium,LeaderboardRow,RankMove,StatRing,LedgerRow,QuestStep,CampaignCard,SocialConnectCard}.tsx` and `components/ui/typography.tsx` (if missing).
- Test: `src/features/quest/components/__tests__/quest-primitives.test.tsx`

**Interfaces:**
- Produces: `Podium({ rows, metric })`, `QuestStep({ status, order, title, description, onClick? })`, `RankMove({ move })`, `StatRing({ value, label, pct })`, `LedgerRow({ time, source, delta })`, `LeaderboardRow({ rank, name, address, score, move })`, `CampaignCard({ data })` where `data: CampaignCardData`, `SocialConnectCard({ provider, connected, handle, onConnect, onDisconnect })`, `Rise`, `TFLoader`. Exact prop names come from the new-ui source — copy them verbatim.

- [ ] **Step 1: Port the full new-ui stylesheet into `quest.css`**

Read both new-ui stylesheets and rebuild `src/features/quest/quest.css` from them (this replaces the broken existing file):

```bash
# from tasmil-quest-folder/frontend
git show origin/new-ui:src/styles/globals.css   # @theme token block
git show origin/new-ui:src/styles/quest.css     # component classes (.page, .camp-card, .x-hero, .qs-row, .podium, .row, .social-card, .stat-ring, .ledger-row, .referral-table, @keyframes rgbsplit, ...)
```

Build the new `quest.css` as: a `.quest-scope { … }` block containing the token set (rewrite the `@theme` `--color-*` names to the `.quest-scope` names the components use), followed by every component class from new-ui's `quest.css`, each selector prefixed/scoped so it only applies inside `.quest-scope` (e.g. `.quest-scope .camp-card { … }`, or wrap the whole sheet in `.quest-scope { … }` using nesting). Token name mapping:

| new-ui `@theme` | `.quest-scope` var |
|---|---|
| `--color-accent` / `-2` / `-deep` / `-ink` / `-soft` / `-line` / `-glow` | `--accent` / `--accent-2` / `--accent-deep` / `--accent-ink` / `--accent-soft` / `--accent-line` / `--accent-glow` |
| `--color-background` / `--color-bg-2` / `--color-surface` / `--color-foreground` | `--bg` / `--bg-2` / `--surface` / `--text` |
| `--color-green*` / `--color-amber*` | `--green*` / `--amber*` |
| `--gradient-brand` / `--gradient-card` | `--grad` / `--card-grad` |
| `--radius-pill` / `--radius-card` / `--radius-sm` / `--radius-xs` | `--r-pill` / `--r-card` / `--r-sm` / `--r-xs` |
| `--color-muted` / `--color-dim` / `--color-line` / `--color-line-2` | `--muted` / `--dim` / `--line` / `--line-2` |

Keep the `--font` / `--font-mono` vars wired to the existing `--font-quest-sans` / `--font-quest-mono` the `(quest)/layout.tsx` already provides.

- [ ] **Step 2: Verify the stylesheet loads (visual smoke)**

Run `pnpm dev`, open `/quest`. The page must render the dark cyan theme without raw-unstyled flashes or missing-variable artifacts (no `var(--…)` resolving to nothing). This is a visual check, not a unit test. Fix any unmapped token references before proceeding.

- [ ] **Step 3: Write the failing test**

Create `src/features/quest/components/__tests__/quest-primitives.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { Podium } from "../Podium";
import { QuestStep } from "../QuestStep";
import { RankMove } from "../RankMove";

describe("quest primitives", () => {
  it("Podium renders the top-3 names", () => {
    render(
      <Podium
        metric="points"
        rows={[
          { rank: 1, name: "stellar_nomad", address: "GDEM...F3A4", score: 14000 },
          { rank: 2, name: "aqua_whale", address: "GDEM...F3A4", score: 13500 },
          { rank: 3, name: "blendmaxi", address: "GDEM...F3A4", score: 13000 },
        ]}
      />,
    );
    expect(screen.getByText("stellar_nomad")).toBeInTheDocument();
    expect(screen.getByText("aqua_whale")).toBeInTheDocument();
    expect(screen.getByText("blendmaxi")).toBeInTheDocument();
  });

  it("QuestStep shows the title and a status indicator", () => {
    render(<QuestStep status="done" order={1} title="Design your index" description="Pick assets" />);
    expect(screen.getByText("Design your index")).toBeInTheDocument();
  });

  it("RankMove renders nothing when move is 0", () => {
    const { container } = render(<RankMove move={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

> Note: align the prop names/shapes in this test with the actual new-ui source you copy in Step 3. If new-ui's `Podium` prop is named differently (e.g. `entries` not `rows`), update both the source-derived component and this test to match — the test must exercise the real API.

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test -- quest-primitives`
Expected: FAIL — cannot find module `../Podium` (and siblings).

- [ ] **Step 5: Port the components (minimal GREEN)**

For each component below, read the new-ui source and write the finance copy applying the Porting Substitution Table. None of these consume hooks or wallet — they are pure presentational, so the only substitutions are `@/components/ui/*` → `@/features/quest/components/ui/*` and `./RankMove` style relative imports (keep relative).

```bash
# Read each source (run from tasmil-quest-folder/frontend); copy content into the finance path.
git show origin/new-ui:src/components/Rise.tsx
git show origin/new-ui:src/components/TFLoader.tsx
git show origin/new-ui:src/components/quest/Podium.tsx          # → components/Podium.tsx
git show origin/new-ui:src/components/quest/RankMove.tsx        # → components/RankMove.tsx
git show origin/new-ui:src/components/quest/LeaderboardRow.tsx  # imports ./RankMove
git show origin/new-ui:src/components/quest/StatRing.tsx
git show origin/new-ui:src/components/quest/LedgerRow.tsx
git show origin/new-ui:src/components/quest/QuestStep.tsx
git show origin/new-ui:src/components/quest/CampaignCard.tsx    # imports @/components/ui/badge → feature ui; fix /campaign link → /quest/campaign
git show origin/new-ui:src/components/quest/SocialConnectCard.tsx
git show origin/new-ui:src/components/ui/typography.tsx         # only if src/features/quest/components/ui/typography.tsx is missing
```

Place each at `src/features/quest/components/<Name>.tsx` (flat — drop the `quest/` sub-folder). In `CampaignCard.tsx`, rewrite the `Link href` from `/campaign/${id}` to `/quest/campaign/${id}`.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- quest-primitives`
Expected: PASS (3 tests green).

- [ ] **Step 7: Lint + commit**

```bash
pnpm check:fix
git add src/features/quest/quest.css src/features/quest/components
git commit -m "feat(quest): port new-ui stylesheet + presentational primitives (Podium, StatRing, QuestStep, ...)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 2: Explore screen

**Files:**
- Replace: `src/features/quest/components/Explore.tsx`
- Test: `src/features/quest/components/__tests__/explore.test.tsx`

**Interfaces:**
- Consumes: `CampaignCard` (Task 1), `Rise` (Task 1), `useCampaignsControllerFindAll` from `@/gen-quest/hooks`, `$` from `@/features/quest/lib/kubb-config`.
- Produces: default-exported `Explore` rendering the hero + featured campaigns grid.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/explore.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Explore from "../Explore";

jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindAll: () => ({ data: undefined, isLoading: true }),
}));

describe("Explore", () => {
  it("renders the hero CTA linking to /quest/campaigns", () => {
    render(<Explore />);
    const cta = screen.getByRole("link", { name: /start questing/i });
    expect(cta).toHaveAttribute("href", "/quest/campaigns");
  });
});
```

> If the new-ui hero CTA label differs from "Start Questing", update the regex to the actual copy (see reference image `18.22.17` — the button reads "Start Questing").

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- explore`
Expected: FAIL — current `Explore.tsx` CTA href is `/campaigns` (or component shape differs), assertion fails.

- [ ] **Step 3: Port Explore (GREEN)**

```bash
git show origin/new-ui:src/components/Explore.tsx
```
Copy into `src/features/quest/components/Explore.tsx`, apply the Porting Substitution Table (hooks → `@/gen-quest/hooks`, `Rise`/`CampaignCard` → feature paths), and rewrite the hero/CTA links (`/campaigns` → `/quest/campaigns`, `/leaderboard` → `/quest/leaderboard`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- explore`
Expected: PASS.

- [ ] **Step 5: Screenshot compare + commit**

Visually compare the running `/quest` page to `tmp/images-quest/2026-06-21 18.22.17.jpg` and `…18.22.34.jpg` (hero copy, stat row `12,400+ / 24 / 1.2M`, feature cards, Featured campaigns grid). Then:

```bash
pnpm check:fix
git add src/features/quest/components/Explore.tsx src/features/quest/components/__tests__/explore.test.tsx
git commit -m "feat(quest): port Explore screen to new-ui look

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 3: Campaigns screen

**Files:**
- Replace: `src/features/quest/components/Campaigns.tsx`
- Test: `src/features/quest/components/__tests__/campaigns.test.tsx`

**Interfaces:**
- Consumes: `CampaignCard`, `Rise`, `Tabs/TabsList/TabsTrigger` (feature ui), `useCampaignsControllerFindAll` (`@/gen-quest/hooks`).
- Produces: default-exported `Campaigns` with an Ongoing/Closed filter + grid. (The new-ui source has exactly **two** tabs — Ongoing and Closed, default Ongoing, querying `{ active: status === "ongoing" }`. Match the source; the reference screenshot's "All" pill is not in the new-ui code.)

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/campaigns.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Campaigns from "../Campaigns";

jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindAll: () => ({
    data: { data: { items: [{ id: "c1", title: "Index Builder", isActive: true, endAt: "2030-01-01T00:00:00Z", rewardPoints: 450 }] } },
    isLoading: false,
  }),
}));

describe("Campaigns", () => {
  it("renders the Ongoing/Closed filter tabs", () => {
    render(<Campaigns />);
    expect(screen.getByRole("tab", { name: /ongoing/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /closed/i })).toBeInTheDocument();
  });
});
```

> Adjust the mocked `data` shape to match what `mapApiCampaignsResponse`/the component actually reads (inspect the new-ui source in Step 3 and align). The assertion on the three tabs is the stable contract.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- campaigns.test`
Expected: FAIL — current component renders differently / tabs not found.

- [ ] **Step 3: Port Campaigns (GREEN)**

```bash
git show origin/new-ui:src/components/Campaigns.tsx
```
Copy → `src/features/quest/components/Campaigns.tsx`, apply substitutions, rewrite any `/campaign/${id}` links via `CampaignCard` (already handled in Task 1).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- campaigns.test`
Expected: PASS.

- [ ] **Step 5: Screenshot compare + commit**

Compare `/quest/campaigns` to `tmp/images-quest/2026-06-21 18.23.07.jpg` (search box, Ongoing/Closed pills — note the screenshot also shows an "All" pill that is NOT in the new-ui source; we match the source's two tabs, flag for product follow-up, `Showing N campaigns`, card grid with `tasmil://...` covers + status badges). Then:

```bash
pnpm check:fix
git add src/features/quest/components/Campaigns.tsx src/features/quest/components/__tests__/campaigns.test.tsx
git commit -m "feat(quest): port Campaigns screen to new-ui look

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 4: Campaign detail screen

**Files:**
- Replace: `src/features/quest/components/CampaignDetail.tsx`
- Test: `src/features/quest/components/__tests__/campaign-detail.test.tsx`

**Interfaces:**
- Consumes: `QuestStep`, `Rise`, `TelegramButton`, `CampaignCardData`; hooks (all `@/gen-quest/hooks`): `useCampaignsControllerFindOne`, `JoinCampaign`, `GetNotJoinedCampaigns`, `ClaimCampaign`, `useTasksControllerVerifyTask`, `GetStatus`, `GetClaimStatus`, `ClaimTask`, `useSocialAccountsControllerFindAll`, `LinkAccount`, `useUsersControllerGetMe`, `usersControllerGetMeQueryKey`; `useWallet` (`@/features/quest/context/wallet-context`); `mapApiCampaignToCampaign` (`@/features/quest/lib/campaign-mapper`).
- Produces: default-exported `CampaignDetail`.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/campaign-detail.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CampaignDetail from "../CampaignDetail";

jest.mock("next/navigation", () => ({ useParams: () => ({ id: "seed-defindex" }) }));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({ isConnected: false, address: null, points: 0, user: null }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindOne: () => ({
    data: { data: { id: "seed-defindex", title: "Index Builder", tasks: [{ id: "t1", title: "Design your index", pointReward: 100, order: 0 }] } },
    isLoading: false,
  }),
  useCampaignsControllerGetNotJoinedCampaigns: () => ({ data: undefined }),
  useCampaignsControllerJoinCampaign: () => ({ mutate: jest.fn(), isPending: false }),
  useCampaignsControllerClaimCampaign: () => ({ mutate: jest.fn(), isPending: false }),
  useTasksControllerVerifyTask: () => ({ mutate: jest.fn(), isPending: false }),
  useTasksControllerGetStatus: () => ({ data: undefined }),
  useTasksControllerGetClaimStatus: () => ({ data: undefined }),
  useTasksControllerClaimTask: () => ({ mutate: jest.fn(), isPending: false }),
  useSocialAccountsControllerFindAll: () => ({ data: undefined }),
  useSocialAccountsControllerLinkAccount: () => ({ mutate: jest.fn() }),
  useUsersControllerGetMe: () => ({ data: undefined }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("CampaignDetail", () => {
  it("renders the campaign title and a quest step", () => {
    render(<CampaignDetail />);
    expect(screen.getByText("Index Builder")).toBeInTheDocument();
    expect(screen.getByText("Design your index")).toBeInTheDocument();
  });
});
```

> The mocked hook return shapes must match what the component reads (inspect the new-ui source). Keep the title + task assertions; adjust mock data fields to the real response shape if needed.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- campaign-detail`
Expected: FAIL — module/shape mismatch with the current component.

- [ ] **Step 3: Port CampaignDetail (GREEN)**

```bash
git show origin/new-ui:src/components/CampaignDetail.tsx
```
Copy → `src/features/quest/components/CampaignDetail.tsx`, apply substitutions (all hooks → `@/gen-quest/hooks`; `useWallet`, `kubb-config`, `campaign-mapper`, `TelegramButton`, `Rise`, `QuestStep` → feature paths), and rewrite related-campaign links to `/quest/campaign/${id}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- campaign-detail`
Expected: PASS.

- [ ] **Step 5: Screenshot compare + commit**

Compare `/quest/campaign/seed-defindex` to `tmp/images-quest/2026-06-21 18.22.41.jpg` (ONGOING / time-left / +pts pills, QuestStep list `0/3 completed`, reward sidebar with trophy + dates + "Complete all tasks to claim", "More for you"). Then:

```bash
pnpm check:fix
git add src/features/quest/components/CampaignDetail.tsx src/features/quest/components/__tests__/campaign-detail.test.tsx
git commit -m "feat(quest): port Campaign detail screen to new-ui look

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 5: Leaderboard screen

**Files:**
- Create: `src/features/quest/components/Leaderboard.tsx` (replaces `leaderboard-page.tsx` as the rendered component)
- Test: `src/features/quest/components/__tests__/leaderboard.test.tsx`

**Interfaces:**
- Consumes: `Podium`, `LeaderboardRow`, `Rise`; hooks `useAnalyticsControllerGlobalLeaderboard`, `useAnalyticsControllerStreakLeaderboard` (`@/gen-quest/hooks`) for the rows/podium; plus the finance season panel data from `useSeasonsControllerCurrent` and `useSeasonsControllerMyResult` (`@/gen-quest/hooks`) for the prize-pool / "Your position #N" / countdown panel (see reference `18.21.13`).
- Produces: default-exported `Leaderboard` with Points/Streak toggle.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/leaderboard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Leaderboard from "../Leaderboard";

jest.mock("@/gen-quest/hooks", () => ({
  useAnalyticsControllerGlobalLeaderboard: () => ({
    data: { data: [{ rank: 1, username: "stellar_nomad", walletAddress: "GDEM...F3A4", totalPoints: 14000 }] },
    isLoading: false,
  }),
  useAnalyticsControllerStreakLeaderboard: () => ({ data: { data: [] }, isLoading: false }),
  useSeasonsControllerCurrent: () => ({ data: { data: { name: "June 2026", prizePoolUsdc: 80 } } }),
  useSeasonsControllerMyResult: () => ({ data: undefined }),
}));

describe("Leaderboard", () => {
  it("renders the Points and Streak toggle", () => {
    render(<Leaderboard />);
    expect(screen.getByRole("tab", { name: /points/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /streak/i })).toBeInTheDocument();
  });
});
```

> Match the mocked response shapes to what the component reads after you inspect the source. The Points/Streak toggle is the stable assertion.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- leaderboard`
Expected: FAIL — module `../Leaderboard` not found.

- [ ] **Step 3: Port Leaderboard (GREEN)**

```bash
git show origin/new-ui:src/components/Leaderboard.tsx
```
Copy → `src/features/quest/components/Leaderboard.tsx`, apply substitutions. Wire the analytics hooks for rows + podium (the Points/Streak toggle). For the season prize-pool / "Your position" / countdown panel (which new-ui renders statically or from its own source), source it from `useSeasonsControllerCurrent` + `useSeasonsControllerMyResult` so it shows real seeded season data. Keep all internal links pointing to `/quest/*`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- leaderboard`
Expected: PASS.

- [ ] **Step 5: Screenshot compare + commit**

Compare `/quest/leaderboard` to: `…18.22.17.jpg` (3D podium 2/1/3, "JUNE 2026"), `…18.21.13.jpg` (prize pool, "Your position #34", countdown), `…18.21.24.jpg` (Points list + Top 3 Prize Pool + Points Rewards), `…18.22.01.jpg` (Streak toggle). Then:

```bash
pnpm check:fix
git add src/features/quest/components/Leaderboard.tsx src/features/quest/components/__tests__/leaderboard.test.tsx
git commit -m "feat(quest): port Leaderboard screen to new-ui look (podium, points/streak)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 6: Profile screen (Overview / My Quests / Referrals / Social Accounts)

**Files:**
- Replace: `src/features/quest/components/Profile.tsx`
- Test: `src/features/quest/components/__tests__/profile.test.tsx` (replaces the existing `Profile.test.tsx` if present)

**Interfaces:**
- Consumes: `StatRing`, `LedgerRow`, `SocialConnectCard`, `Rise`, `TelegramButton`, feature ui primitives; hooks (`@/gen-quest/hooks`): `useSocialAccountsControllerFindAll`, `LinkAccount`, `UnlinkAccount`, `useUsersControllerUpdateProfile`, `GetMyCampaigns`, `useReferralControllerGetMyReferral`, `useUsersControllerGetReferrals`, `GetPointsHistory`; `useWallet` + `useQuestAuthStore`; `mapApiCampaignToCampaign`.
- Produces: default-exported `Profile` with the four tabs.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/profile.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Profile from "../Profile";

jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({ isAuthenticated: true, address: "GDPI...TKEF", points: 10, user: { username: "user_3abe7ed8", tier: "COHORT_4", totalPoints: 10, loginStreak: 1, referralCode: "46676f23" }, connect: jest.fn() }),
}));
jest.mock("@/features/quest/store/use-quest-auth", () => ({ useQuestAuthStore: () => ({ updateUser: jest.fn() }) }));
jest.mock("@/gen-quest/hooks", () => ({
  useSocialAccountsControllerFindAll: () => ({ data: { data: [] } }),
  useSocialAccountsControllerLinkAccount: () => ({ mutate: jest.fn() }),
  useSocialAccountsControllerUnlinkAccount: () => ({ mutate: jest.fn() }),
  useUsersControllerUpdateProfile: () => ({ mutate: jest.fn() }),
  useUsersControllerGetMyCampaigns: () => ({ data: { data: [] } }),
  useReferralControllerGetMyReferral: () => ({ data: undefined }),
  useUsersControllerGetReferrals: () => ({ data: { data: [] } }),
  useUsersControllerGetPointsHistory: () => ({ data: { data: [] } }),
}));

describe("Profile", () => {
  it("renders the four profile tabs", () => {
    render(<Profile />);
    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /my quests/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /referrals/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /social accounts/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- profile.test`
Expected: FAIL — current `Profile.tsx` tab structure differs.

- [ ] **Step 3: Port Profile (GREEN)**

```bash
git show origin/new-ui:src/components/Profile.tsx
```
Copy → `src/features/quest/components/Profile.tsx`, apply substitutions (note `useAuthStore` → `useQuestAuthStore` from `@/features/quest/store/use-quest-auth`; `StatRing`/`LedgerRow`/`SocialConnectCard` → feature paths; all hooks → `@/gen-quest/hooks`). Delete the stale `Profile.test.tsx` if it tested the old structure.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- profile.test`
Expected: PASS.

- [ ] **Step 5: Screenshot compare + commit**

Compare each tab to: Overview `…18.21.01.jpg`, My Quests `…18.20.28.jpg`, Referrals `…18.19.58.jpg` + `…18.20.38.jpg`, Social Accounts `…18.21.48.jpg`. Then:

```bash
pnpm check:fix
git add src/features/quest/components/Profile.tsx src/features/quest/components/__tests__/profile.test.tsx
git rm --ignore-unmatch src/features/quest/components/Profile.test.tsx
git commit -m "feat(quest): port Profile screen (overview/quests/referrals/socials) to new-ui look

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 7: Navbar + Footer

**Files:**
- Replace: `src/features/quest/components/Navbar.tsx`, `src/features/quest/components/Footer.tsx`
- Test: `src/features/quest/components/__tests__/quest-nav.test.tsx`

**Interfaces:**
- Consumes: `useWallet` (feature), `useUsersControllerGetCheckInStatus`, `useUsersControllerDailyLogin`, `usersControllerGetMeQueryKey` (`@/gen-quest/hooks`).
- Produces: default-exported `Navbar` (the `QuestNavbar`) and `Footer` (the `QuestFooter`) with nav links pointing at `/quest/*`.

- [ ] **Step 1: Write the failing test**

Create `src/features/quest/components/__tests__/quest-nav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";

jest.mock("next/navigation", () => ({ usePathname: () => "/quest" }));
jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({ isAuthenticating: false, address: null, displayAddress: null, points: 0, user: null, connect: jest.fn(), disconnect: jest.fn(), isAuthenticated: false, isConnected: false }),
}));
jest.mock("@tanstack/react-query", () => ({ ...jest.requireActual("@tanstack/react-query"), useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetCheckInStatus: () => ({ data: undefined }),
  useUsersControllerDailyLogin: () => ({ mutate: jest.fn(), isPending: false }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("Quest Navbar", () => {
  it("links the nav items to /quest/* routes", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /campaigns/i })).toHaveAttribute("href", "/quest/campaigns");
    expect(screen.getByRole("link", { name: /leaderboard/i })).toHaveAttribute("href", "/quest/leaderboard");
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute("href", "/quest/profile");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- quest-nav`
Expected: FAIL — current nav hrefs differ / component shape mismatch.

- [ ] **Step 3: Port Navbar + Footer (GREEN)**

```bash
git show origin/new-ui:src/components/Navbar.tsx
git show origin/new-ui:src/components/Footer.tsx
```
Copy → feature paths, apply substitutions, and rewrite every nav/footer `href` (`/`→`/quest`, `/campaigns`→`/quest/campaigns`, `/leaderboard`→`/quest/leaderboard`, `/profile`→`/quest/profile`). Keep the existing finance `QuestNav.tsx` as the layout's nav only if the layout references it — otherwise point the layout at this `Navbar` (handled in Task 8).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- quest-nav`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
pnpm check:fix
git add src/features/quest/components/Navbar.tsx src/features/quest/components/Footer.tsx src/features/quest/components/__tests__/quest-nav.test.tsx
git commit -m "feat(quest): port Navbar + Footer to new-ui look with /quest links

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 8: Wire barrel + routes, retire legacy, build green

**Files:**
- Modify: `src/features/quest/index.ts`
- Modify: `src/app/(quest)/leaderboard/page.tsx` (and others if they import retired components)
- Modify: `src/app/(quest)/layout.tsx` (point nav/footer at the ported components if names changed)
- Delete (if no importers): `src/features/quest/components/{leaderboard-table,season-podium,podium-card}.tsx`

**Interfaces:**
- Consumes: all ported components (Tasks 1–7).
- Produces: a building app where `/quest/*` routes render the ported screens.

- [ ] **Step 1: Write the failing check (type + build)**

Run: `pnpm type-check`
Expected: FAIL — `leaderboard/page.tsx` imports `LeaderboardPage` which no longer matches, and the barrel exports point at retired files / mismatched names.

- [ ] **Step 2: Re-point the barrel and routes (GREEN)**

In `src/features/quest/index.ts`, update exports to the ported components:
- `export { default as Leaderboard } from "./components/Leaderboard";` (replace the `LeaderboardPage`/`LeaderboardTable` exports).
- Ensure `Explore`, `Campaigns`, `CampaignDetail`, `Profile`, `QuestNavbar` (from `./components/Navbar`), `QuestFooter` (from `./components/Footer`), `CampaignCard`, and the new primitives (`Podium`, `StatRing`, `LedgerRow`, `QuestStep`, `RankMove`, `LeaderboardRow`, `SocialConnectCard`, `Rise`, `TFLoader`) are exported.

In `src/app/(quest)/leaderboard/page.tsx`, render `<Leaderboard />` instead of `<LeaderboardPage />`. Verify the other `(quest)` pages still render the correct default exports (`Explore`, `Campaigns`, `CampaignDetail`, `Profile`). In `layout.tsx`, point the header/footer at the ported `Navbar`/`Footer` if the export names changed.

Delete retired files only if `grep -rn "leaderboard-table\|season-podium\|podium-card" src` returns no importers.

- [ ] **Step 3: Run type-check + full test + build**

Run:
```bash
pnpm type-check
pnpm test
pnpm build
```
Expected: all exit 0.

- [ ] **Step 4: Manual route smoke**

Run `pnpm dev`, visit `/quest`, `/quest/campaigns`, `/quest/campaign/seed-defindex`, `/quest/leaderboard`, `/quest/profile`. Confirm each renders the new look and internal links stay within `/quest/*`.

- [ ] **Step 5: Lint + commit**

```bash
pnpm check:fix
git add src/features/quest/index.ts "src/app/(quest)"
git rm --ignore-unmatch src/features/quest/components/leaderboard-table.tsx src/features/quest/components/season-podium.tsx src/features/quest/components/podium-card.tsx
git commit -m "feat(quest): wire barrel + routes to ported screens, retire legacy leaderboard components

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

## Self-Review

**Spec coverage (Plan 2 portion — Workstream A1–A4):**
- A1 tokens → already present in `quest.css`; Porting Table notes "add only missing classes". ✓
- A2 quest.css → Task 1 ports the **entire** new-ui stylesheet (tokens + component classes) into `quest.css`, replacing the broken existing file. ✓
- A3 components (Podium, LeaderboardRow, RankMove, StatRing, LedgerRow, QuestStep, CampaignCard, Rise, TFLoader, screens) ported + rewired to `@/gen-quest` and feature wallet/auth → Tasks 1–7. Retire legacy → Task 8. ✓
- A4 routing → Porting Table link rewrites in every task + Task 8 route/barrel wiring. ✓
- Pixel verification → Step 5 screenshot-compare against named reference images in each screen task. ✓
- TDD test-first → every task: RED (failing Jest/RTL) → GREEN (port) → verify. ✓

**A5 (cross-surface badges) is intentionally Plan 3**, not here — it touches `src/shared/` and the chat header.

**Placeholder scan:** GREEN steps reference exact new-ui source paths + the Porting Substitution Table rather than inlining hundreds of ported JSX lines — this is the correct, non-placeholder way to specify a 1:1 port (the source is the spec). All test code is complete and runnable. Notes that say "align the mock shape to the real source" are guidance for the implementer, not deferred work — the asserted contract (links, tabs, titles) is concrete.

**Type/name consistency:** hook names verified to exist in `gen-quest`; `useWallet` shape identical between new-ui and finance (pure import swap); `useAuthStore`→`useQuestAuthStore` rename applied wherever new-ui used it (CampaignDetail uses `useWallet` only; Profile + AutoReconnect use the store — only Profile is ported here). Barrel export name `Leaderboard` used consistently in Task 5 and Task 8.

**Dependency:** requires Plan 1's seed (real data) for the Step 5 screenshot comparisons and the `/quest/campaign/seed-defindex` smoke route, and Plan 1's dev-login + Plan 3's dev-bypass bridge for authenticated screens (Profile) to populate. Until Plan 3 wires the bridge, Profile can be smoke-tested with the dev-bypass store seeded manually; the unit tests here mock all hooks and need neither.
