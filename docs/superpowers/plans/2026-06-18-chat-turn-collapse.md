# Chat Turn Collapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix chat render order so "Thinking..." always appears before response text - intermediate supervisor messages are hidden while a sub-agent is loading, revealing only after the turn completes.

**Architecture:** Single change in `chat-client.tsx`'s render loop. After computing the `filtered` message array, identify the current turn boundary (last human message index). When `effectiveIsLoading` is true, return `null` for all AI messages in the current turn except the last one. The last message naturally shows "Thinking..." (no content) then streams text when tokens arrive. All messages reveal normally once `effectiveIsLoading` is false.

**Tech Stack:** Next.js 16, React, TypeScript

---

### Task 1: Add turn-collapse logic to chat-client.tsx

**Files:**
- Modify: `tasmil-finance/src/features/chat/components/chat-client.tsx:647-690`

This is a visual behavior change - no unit tests exist for this component. Verification is manual (dev server).

- [ ] **Step 1: Read the current render loop to confirm line numbers**

```bash
sed -n '647,691p' tasmil-finance/src/features/chat/components/chat-client.tsx
```

Expected: you see `const filtered = visible.filter(...)` followed by `return filtered.map(...)`.

- [ ] **Step 2: Add turn-collapse variables after the `filtered` computation**

Find this block (lines ~647-651):
```typescript
              const filtered = visible.filter(
                (m, index, arr) => !shouldFilterMessage(m, index, arr, uiComponents, messages)
              );

              return filtered.map((message, index, arr) => {
```

Replace with:
```typescript
              const filtered = visible.filter(
                (m, index, arr) => !shouldFilterMessage(m, index, arr, uiComponents, messages)
              );

              // Turn collapse: suppress intermediate AI messages while loading
              // so "Thinking..." always precedes text, never follows it.
              const lastHumanIdx = (() => {
                for (let i = filtered.length - 1; i >= 0; i--) {
                  if (filtered[i].type === "human") return i;
                }
                return -1;
              })();
              const currentTurnStart = lastHumanIdx + 1;
              const collapsingTurn = effectiveIsLoading;

              return filtered.map((message, index, arr) => {
                // Hide intermediate AI messages in the current turn while loading.
                // The last message is never suppressed - it shows Thinking... or streams text.
                if (
                  collapsingTurn &&
                  index >= currentTurnStart &&
                  index < arr.length - 1 &&
                  message.type !== "human"
                ) {
                  return null;
                }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd tasmil-finance && pnpm type-check 2>&1 | grep "chat-client"
```

Expected: no output (no errors in chat-client.tsx).

- [ ] **Step 4: Run lint**

```bash
cd tasmil-finance && pnpm check:fix 2>&1 | grep "chat-client"
```

Expected: no errors in chat-client.tsx.

- [ ] **Step 5: Manual verification - start dev server**

```bash
cd tasmil-finance && pnpm dev
```

Open `http://localhost:3000` (auto-redirects to `/chat` with dev bypass). Send `"hi"`.

**Expected behavior:**
1. "Thinking..." spinner appears as single bubble
2. When sub-agent responds, "Thinking..." disappears → text streams in progressively
3. Once stream complete, supervisor's intro text (if any) appears as bubble above the response

**Old behavior (confirm it's gone):**
- Supervisor text bubble fully visible, then "Thinking..." bubble appears below it

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance
git add src/features/chat/components/chat-client.tsx
git commit -m "fix: collapse intermediate AI messages during loading to fix Thinking→text render order"
```
