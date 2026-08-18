# Chat Turn Collapse - Design Spec
_Date: 2026-06-18_

## Goal

Fix render order so "Thinking..." always appears before response text within a single AI turn. Currently, intermediate supervisor text streams in first, then a separate "Thinking..." bubble appears below it - backwards from the expected UX.

## Problem

When user sends a message (e.g. "hi"):
1. Supervisor streams its text response immediately → visible bubble
2. Supervisor dispatches sub-agent → new bubble appears with "Thinking..."

User sees: **text → Thinking...** (wrong)
User expects: **Thinking... → text streaming in** (correct)

---

## Architecture

### Turn definition

A "turn" = all consecutive AI messages after the most recent human message, with no human message between them.

```
[user: "hi"] [ai: supervisor text] [ai: Thinking...]
              ^------- current turn -------^
```

### Collapse rule

In `chat-client.tsx`, before the `filtered.map(...)` render loop:

1. Find the index of the last human message in `filtered`
2. Everything after it (AI messages only) = current turn
3. When `effectiveIsLoading === true`: render only the **last** message in the current turn; skip all others in the turn
4. When `effectiveIsLoading === false`: render all messages normally (no collapse)

### Single file changed

`src/features/chat/components/chat-client.tsx` - ~15 lines added to the rendering loop. No other files touched.

---

## State Transitions

| Phase | What user sees |
|---|---|
| Loading starts | Only "Thinking..." (last message in turn) |
| Sub-agent first token arrives | "Thinking..." disappears → text streams progressively into same bubble |
| Streaming in progress | Sub-agent text streams; supervisor text still hidden |
| Turn complete (`effectiveIsLoading = false`) | Sub-agent text complete; supervisor's earlier text reveals as bubble above |

The Thinking → streaming transition is fully preserved - no pop-in on the response itself. Only the supervisor's intermediate text reveals after completion.

---

## Production Safety

- Logic is gated on `effectiveIsLoading` - zero behavior change when not loading
- No new state, no new components, no backend changes
- Single-turn conversations (no sub-agents) unaffected: current turn has 1 AI message → it's the last, never suppressed
- Existing `shouldFilterMessage` and cache merge logic untouched

---

## Implementation

### Variables needed

```typescript
// Index of last human message in filtered array
const lastHumanIdx = (() => {
  for (let i = filtered.length - 1; i >= 0; i--) {
    if (filtered[i].type === "human") return i;
  }
  return -1;
})();

// First index of current AI turn
const currentTurnStart = lastHumanIdx + 1;

// Whether to collapse intermediate messages in this turn
const collapsingTurn = effectiveIsLoading;
```

### Render condition

In the `filtered.map(...)` loop, before rendering each message:

```typescript
// Suppress intermediate AI messages in current turn while thinking
if (
  collapsingTurn &&
  index >= currentTurnStart &&
  index < filtered.length - 1 &&
  message.type !== "human"
) {
  return null;
}
```

The last message in the turn (`index === filtered.length - 1`) is never suppressed - it's the one displaying "Thinking..." or streaming text.
