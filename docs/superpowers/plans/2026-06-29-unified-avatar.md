# Unified Tasmil Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the four divergent avatar techniques with one shared `boring-avatars` component so avatars look consistent across the tasmil-finance main app, the tasmil-finance quest area, and tasmil-strategy.

**Architecture:** A single `TasmilAvatar` component (deterministic `boring-avatars`, brand palette, seeded by identity) is created once per repo — identical file content. Within tasmil-finance the main app and quest both import it. Quest keeps an avatar picker that lets users choose a `boring-avatars` variant, persisted as a compact `tasmil:<variant>` token in the existing `avatarUrl` field (no backend schema change). Strategy seeds best-effort by `publisherId ?? publisherName`.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind, `boring-avatars`; finance tests = Jest + jsdom + Testing Library; strategy has NO test runner (gate = `tsc` + Biome).

## Global Constraints
- Brand palette (both repos' globals.css), use exactly: `["#67e8f9", "#0ea5e9", "#0369a1", "#04141a", "#d9fbff"]`.
- Default variant: `marble`. Quest picker variants in order: `marble`, `bauhaus`, `beam`, `pixel`, `ring`, `sunset`.
- Persisted picker token: `tasmil:<variant>`. Legacy `https://api.dicebear.com/...` and empty values must fall back to `marble` — no migration.
- `cn` util is `@/lib/utils` in BOTH repos. Path alias `@/*` -> `src/*` in both.
- Biome: 2-space indent, double quotes, width 100, `import type` for types, no console.log. Run `pnpm check:fix` before commit.
- `boring-avatars` NOT installed in either repo. Default export = avatar component; props: `name` (seed), `size` (number), `variant`, `colors` (string[]). Verify prop names against installed version at Task 1.
- The two `tasmil-avatar.tsx` files (finance `src/shared/components/`, strategy `src/shared/ui/`) must stay byte-identical in config.
- `farming-2/components/farming-header.tsx` only mentions avatar size in a COMMENT — NOT an avatar; do not touch.
- WORKING TREE NOTE: both repos are on branch `feat/freighter-network-watcher` with pre-existing uncommitted WIP. `connect-wallet-button.tsx` (Task 2) and `Profile.tsx` (Task 4) already have unstaged user changes. User approved proceeding; `git add` ONLY the avatar paths listed per task (those two files will carry the user's WIP into the commit — accepted).

---

### Task 1: TasmilAvatar component + normalizeSeed (tasmil-finance)
Files: Modify `package.json`; Create `src/shared/components/tasmil-avatar.tsx`; Test `src/shared/components/tasmil-avatar.test.ts`.
Produces: `TASMIL_AVATAR_COLORS`, `type TasmilAvatarVariant = "marble"|"bauhaus"|"beam"|"pixel"|"ring"|"sunset"`, `normalizeSeed(seed)`, `TasmilAvatar({seed, size?: number|"full", variant?, className?})`.

- [ ] Step 1: `pnpm add boring-avatars` (from tasmil-finance/).
- [ ] Step 2: Write failing test `src/shared/components/tasmil-avatar.test.ts`:
```ts
import { normalizeSeed, TASMIL_AVATAR_COLORS } from "./tasmil-avatar";
describe("normalizeSeed", () => {
  it("lowercases and trims", () => { expect(normalizeSeed("  GDQI...3I6R  ")).toBe("gdqi...3i6r"); });
  it("falls back to 'default'", () => {
    expect(normalizeSeed(null)).toBe("default");
    expect(normalizeSeed(undefined)).toBe("default");
    expect(normalizeSeed("   ")).toBe("default");
  });
  it("is deterministic", () => { expect(normalizeSeed("Alice")).toBe(normalizeSeed("alice")); });
});
describe("TASMIL_AVATAR_COLORS", () => {
  it("is the exact brand palette", () => {
    expect(TASMIL_AVATAR_COLORS).toEqual(["#67e8f9","#0ea5e9","#0369a1","#04141a","#d9fbff"]);
  });
});
```
- [ ] Step 3: Run `pnpm test -- src/shared/components/tasmil-avatar.test.ts` -> FAIL (module not found).
- [ ] Step 4: Create `src/shared/components/tasmil-avatar.tsx`:
```tsx
import Avatar from "boring-avatars";
import { cn } from "@/lib/utils";

export const TASMIL_AVATAR_COLORS = ["#67e8f9", "#0ea5e9", "#0369a1", "#04141a", "#d9fbff"];
export type TasmilAvatarVariant = "marble" | "bauhaus" | "beam" | "pixel" | "ring" | "sunset";

export function normalizeSeed(seed: string | null | undefined): string {
  const s = (seed ?? "").trim().toLowerCase();
  return s.length > 0 ? s : "default";
}

interface TasmilAvatarProps {
  seed: string | null | undefined;
  size?: number | "full";
  variant?: TasmilAvatarVariant;
  className?: string;
}

export function TasmilAvatar({ seed, size = 40, variant = "marble", className }: TasmilAvatarProps) {
  const fill = size === "full";
  const px = fill ? 96 : size;
  return (
    <span
      className={cn(
        "inline-block overflow-hidden rounded-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full",
        fill && "h-full w-full",
        className
      )}
      style={fill ? undefined : { width: px, height: px }}
    >
      <Avatar name={normalizeSeed(seed)} size={px} variant={variant} colors={TASMIL_AVATAR_COLORS} />
    </span>
  );
}
```
- [ ] Step 5: Run test -> PASS.
- [ ] Step 6: `pnpm type-check && pnpm check:fix` -> clean.
- [ ] Step 7: Commit `git add package.json pnpm-lock.yaml src/shared/components/tasmil-avatar.tsx src/shared/components/tasmil-avatar.test.ts && git commit -m "feat(avatar): add shared TasmilAvatar component (boring-avatars)"`.

---

### Task 2: Swap main-app AddressAvatar to TasmilAvatar (tasmil-finance)
Files: `src/shared/components/connect-wallet-button.tsx:28-65`; `src/shared/components/connect-wallet-button.test.tsx:50`; `src/shared/layout/mobile-sidebar-content.tsx:19-45`.
Consumes: `TasmilAvatar`. Keep `AddressAvatar` props `{address; size?: string; iconSize?: string}` so call sites in `wallet-header.tsx` (size-20) and `QuestNav.tsx` (size-5) still compile.

- [ ] Step 1: In `connect-wallet-button.test.tsx` change the line ~50 assertion `expect(trigger.querySelector(".bg-gradient-to-br")).not.toBeNull();` to `expect(trigger.querySelector(".rounded-full")).not.toBeNull();`.
- [ ] Step 2: Run `pnpm test -- src/shared/components/connect-wallet-button.test.tsx` -> PASS (current gradient div also has rounded-full).
- [ ] Step 3: In `connect-wallet-button.tsx` replace lines 28-65 (interface + component) with:
```tsx
interface AddressAvatarProps {
  address: string;
  size?: string;
  iconSize?: string;
}

function sizeClassToPx(size: string): number {
  const n = Number.parseInt(size.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n * 4 : 48;
}

const AddressAvatar = ({ address, size = "size-12" }: AddressAvatarProps) => (
  <TasmilAvatar seed={address} size={sizeClassToPx(size)} />
);
```
Remove `User` from the lucide-react import (line 3). Add `import { TasmilAvatar } from "@/shared/components/tasmil-avatar";`.
- [ ] Step 4: In `mobile-sidebar-content.tsx` replace the local `AddressAvatar` (lines 19-45) with:
```tsx
const AddressAvatar = ({ address, size = "size-12" }: { address: string; size?: string }) => {
  const px = Number.parseInt(size.replace(/[^0-9]/g, ""), 10);
  return <TasmilAvatar seed={address} size={Number.isFinite(px) && px > 0 ? px * 4 : 48} />;
};
```
Add `import { TasmilAvatar } from "@/shared/components/tasmil-avatar";`. Remove now-unused imports (e.g. `cn`, `User`) ONLY if unreferenced elsewhere (grep first).
- [ ] Step 5: Run `pnpm test -- src/shared/components/connect-wallet-button.test.tsx` -> PASS.
- [ ] Step 6: `pnpm type-check && pnpm check:fix` -> clean.
- [ ] Step 7: Commit `git add src/shared/components/connect-wallet-button.tsx src/shared/components/connect-wallet-button.test.tsx src/shared/layout/mobile-sidebar-content.tsx && git commit -m "feat(avatar): use TasmilAvatar for main-app wallet avatars"`.

---

### Task 3: Rewrite quest avatar lib to variant-token helpers (tasmil-finance)
Files: replace contents of `src/features/quest/lib/avatar.ts` and `src/features/quest/lib/avatar.test.ts`.
Consumes: `TasmilAvatarVariant`. Produces: `QUEST_AVATAR_VARIANTS`, `variantToken(v)`, `variantFromAvatarUrl(url?)`. Removes `qHash`/`qAvatar` (used by Task 4 sites — do Task 4 same branch, commit 3+4 together).

- [ ] Step 1: Replace `avatar.test.ts`:
```ts
import { QUEST_AVATAR_VARIANTS, variantFromAvatarUrl, variantToken } from "./avatar";
describe("variantToken", () => {
  it("formats the token", () => { expect(variantToken("bauhaus")).toBe("tasmil:bauhaus"); });
});
describe("variantFromAvatarUrl", () => {
  it("parses a valid token", () => { expect(variantFromAvatarUrl("tasmil:pixel")).toBe("pixel"); });
  it("falls back to marble for empty/null", () => {
    expect(variantFromAvatarUrl(null)).toBe("marble");
    expect(variantFromAvatarUrl(undefined)).toBe("marble");
    expect(variantFromAvatarUrl("")).toBe("marble");
  });
  it("falls back for legacy dicebear", () => {
    expect(variantFromAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=quest3")).toBe("marble");
  });
  it("falls back for unknown token", () => { expect(variantFromAvatarUrl("tasmil:notreal")).toBe("marble"); });
});
describe("QUEST_AVATAR_VARIANTS", () => {
  it("lists six variants in order", () => {
    expect(QUEST_AVATAR_VARIANTS).toEqual(["marble","bauhaus","beam","pixel","ring","sunset"]);
  });
});
```
- [ ] Step 2: Run test -> FAIL.
- [ ] Step 3: Replace `avatar.ts`:
```ts
import type { TasmilAvatarVariant } from "@/shared/components/tasmil-avatar";

export const QUEST_AVATAR_VARIANTS: TasmilAvatarVariant[] = [
  "marble", "bauhaus", "beam", "pixel", "ring", "sunset",
];

const TOKEN_PREFIX = "tasmil:";

export function variantToken(variant: TasmilAvatarVariant): string {
  return `${TOKEN_PREFIX}${variant}`;
}

export function variantFromAvatarUrl(avatarUrl?: string | null): TasmilAvatarVariant {
  if (avatarUrl?.startsWith(TOKEN_PREFIX)) {
    const candidate = avatarUrl.slice(TOKEN_PREFIX.length) as TasmilAvatarVariant;
    if (QUEST_AVATAR_VARIANTS.includes(candidate)) return candidate;
  }
  return "marble";
}
```
- [ ] Step 4: Run test -> PASS.
- [ ] Step 5: Do NOT commit (build red until Task 4). Proceed to Task 4.

---

### Task 4: Migrate all quest render sites + picker to TasmilAvatar (tasmil-finance)
Files: `Navbar.tsx`, `Profile.tsx`, `LeaderboardRow.tsx`, `Podium.tsx`, `Referrals.tsx`, `AvatarStack.tsx` under `src/features/quest/components/`.
Consumes: `TasmilAvatar`, `variantFromAvatarUrl`/`variantToken`/`QUEST_AVATAR_VARIANTS`. Convention: keep existing sized/rounded/bordered wrapper; delete `style={{ background: <gradientFn>(...) }}`; render `<TasmilAvatar seed size="full"/>` (or fixed numeric size) inside. Seed = wallet where available; referral rows/trees keep seeding by existing name/username.

- [ ] Step 1: Navbar.tsx — add `import { TasmilAvatar } from "@/shared/components/tasmil-avatar";` and `import { variantFromAvatarUrl } from "@/features/quest/lib/avatar";`. Delete `avatarFromAddress` (~L32-38) and `getAvatarUrl` (~L143-146). Remove unused `Avatar, AvatarFallback, AvatarImage` import (L9). Replace the wallet chip avatar block (~L297-307, the `<span style={{background: avatarFromAddress(...)}}>` wrapping Radix Avatar) with:
```tsx
<TasmilAvatar seed={address ?? ""} variant={variantFromAvatarUrl(user?.avatarUrl)} size={30} className="flex-none" />
```
- [ ] Step 2: Profile.tsx — delete `avatarBg` (~L91-100) and `AV_COLORS` (~L107-118). Change L18 import to `import { QUEST_AVATAR_VARIANTS, variantFromAvatarUrl, variantToken } from "@/features/quest/lib/avatar";`. Add `import { TasmilAvatar } from "@/shared/components/tasmil-avatar";`.
- [ ] Step 3: Profile.tsx sidebar avatar (~L229-245): keep bordered ring, fill with TasmilAvatar, keep the Edit2 button:
```tsx
<div className="relative w-24 h-24 mb-[14px] max-[720px]:w-16 max-[720px]:h-16">
  <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)] max-[720px]:w-16 max-[720px]:h-16">
    <TasmilAvatar seed={user?.walletAddress ?? "default"} variant={variantFromAvatarUrl(user?.avatarUrl)} size="full" />
  </div>
  <button className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full grid place-items-center bg-[var(--surface)] border border-[rgba(255,255,255,0.14)] cursor-pointer text-[rgba(244,247,251,0.58)] hover:text-[var(--accent)] hover:border-[rgba(103,232,249,0.32)]" onClick={() => setShowAvPicker(!showAvPicker)} aria-label="Change avatar">
    <Edit2 size={15} />
  </button>
</div>
```
- [ ] Step 4: Profile.tsx picker (~L312-330): replace AV_COLORS swatches with variant tiles:
```tsx
{showAvPicker && (
  <div>
    <div className="grid grid-cols-3 gap-[10px]">
      {QUEST_AVATAR_VARIANTS.map((v) => (
        <button key={v} type="button" className="w-full aspect-square rounded-[14px] cursor-pointer border-2 border-transparent overflow-hidden transition-[border-color,transform] duration-[250ms] hover:scale-105 hover:border-[var(--accent)]" onClick={() => { updateUser({ avatarUrl: variantToken(v) }); setShowAvPicker(false); }}>
          <TasmilAvatar seed={user?.walletAddress ?? "default"} variant={v} size="full" />
        </button>
      ))}
    </div>
  </div>
)}
```
Note: preserves prior behavior of writing local store `user.avatarUrl` (old code also only did updateUser). Backend update-avatar endpoint out of scope.
- [ ] Step 5: Profile.tsx TreeRow avatar (~L1140-1143) -> `<TasmilAvatar seed={node.name} size={28} className="flex-none" />`. Referrals list row (~L1518-1522) -> `<TasmilAvatar seed={r.username ?? "u"} size={30} className="flex-none" />`.
- [ ] Step 6: LeaderboardRow.tsx — delete `avatarGradient` (~L13-18); add TasmilAvatar import; replace avatar span (~L63) -> `<TasmilAvatar seed={address} size={40} className="flex-none" />`.
- [ ] Step 7: Podium.tsx — delete `avatarGradient` (~L6-11); add TasmilAvatar import; replace avatar `<span>` (~L58-66) keeping rank ring classes + add `overflow-hidden`, inner `<TasmilAvatar seed={r.address} size="full" />`. (`cn` already imported.)
- [ ] Step 8: Referrals.tsx — change L5 import to TasmilAvatar; tree avatar (~L71-74) -> `<TasmilAvatar seed={node.name} size={28} className="flex-none" />`; list avatar (~L219-222) -> `<TasmilAvatar seed={u.name} size={28} className="flex-none" />`.
- [ ] Step 9: AvatarStack.tsx — change L1 import to TasmilAvatar; fallback circle (~L46-49) -> `<TasmilAvatar key={`fb-${i}`} seed={seed + i} size={28} className="border-2 border-[#0c0c0e] -ml-[9px] first:ml-0" />`. Real-image circles unchanged.
- [ ] Step 10: `grep -rnE "qAvatar|qHash|avatarBg|avatarGradient|avatarFromAddress|api\.dicebear\.com|AV_COLORS" src/features/quest` -> no matches.
- [ ] Step 11: `pnpm test -- src/features/quest && pnpm type-check && pnpm check:fix` -> PASS/clean.
- [ ] Step 12: Commit `git add src/features/quest && git commit -m "feat(avatar): unify quest avatars on TasmilAvatar + variant picker"`.

---

### Task 5: Strategy — install dep, add TasmilAvatar, swap card initials (tasmil-strategy)
Files: `package.json`; Create `src/shared/ui/tasmil-avatar.tsx`; `src/features/marketplace/components/strategy-card.tsx`.
Strategy has NO test runner; gate = `pnpm type-check` + `pnpm check:fix` + visual.

- [ ] Step 1: `pnpm add boring-avatars` (from tasmil-strategy/).
- [ ] Step 2: Create `src/shared/ui/tasmil-avatar.tsx` with the EXACT same content as the finance component (Task 1 Step 4) — `cn` from `@/lib/utils` resolves in strategy too.
- [ ] Step 3: In `strategy-card.tsx`: add `import { TasmilAvatar } from "@/shared/ui/tasmil-avatar";`; delete `const avatar = publisher.slice(0, 2).toUpperCase();` (L31); add after the `publisher` line (~L30) `const publisherSeed = strategy.publisherId ?? strategy.publisherName ?? "unknown";`; replace the publisher avatar `<span>` (~L54-60, the `<span ... bg-[image:var(--grad)]>{avatar}</span>`) with `<TasmilAvatar seed={publisherSeed} size={22} className="flex-none" />`. Keep `by {publisher.slice(0, 12)}`.
- [ ] Step 4: `pnpm type-check && pnpm check:fix` -> clean.
- [ ] Step 5: Visual: `pnpm dev` (port 3001), marketplace shows boring-avatars blobs (not initials); same publisher -> same blob.
- [ ] Step 6: Commit `git add package.json pnpm-lock.yaml src/shared/ui/tasmil-avatar.tsx src/features/marketplace/components/strategy-card.tsx && git commit -m "feat(avatar): use TasmilAvatar for strategy publisher avatars"`.

---

## Self-Review
Covers: shared component (T1,T5); delete main-app User-icon gradient (T2, both copies); delete quest blob/DiceBear (T4 grep gate); delete strategy initials (T5); picker variants + token (T3,T4); seed by identity (T2 wallet, T4 wallet/name, T5 publisher); offline render no dicebear (T1,T5 install + T4 removal); reuse avatarUrl field graceful fallback (T3); replace avatar.test.ts (T3). Line numbers reflect plan-writing time — locate by quoted symbol if shifted.
