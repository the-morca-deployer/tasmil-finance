/**
 * The signing journey's state machine.
 *
 * Pure: no React, no network, no clock. That is deliberate — the journey cannot
 * be exercised live without a fresh funded mainnet wallet, so this file is
 * where its behaviour is actually pinned down, by `journey.test.ts`.
 *
 * THE STEP LIST IS DATA. `JOURNEY_STEPS` is the single place the chain's shape
 * is declared, and every renderer walks it. Mainnet needs three signatures
 * today because the pinned keeper-wallet WASM's `__constructor` takes only
 * `(owner, owner_pubkey)`, leaving no room to register the session key in the
 * same transaction. When a six-parameter build ships to mainnet and deploy +
 * configure collapse into one signature, this array shrinks by one entry and
 * nothing else changes.
 */

import type {
  AccountStatus,
  JourneyEvent,
  JourneyProgress,
  JourneyStepConfig,
  JourneyStepId,
  JourneyStepView,
} from "../types";

export const JOURNEY_STEPS: readonly JourneyStepConfig[] = [
  {
    id: "deploy",
    title: "Deploy your keeper wallet",
    detail: "A contract account you own. Tasmil never holds the keys to it.",
  },
  {
    id: "configure_session_key",
    title: "Register the agent's session key",
    detail:
      "A scoped key the agent signs rebalances with. Rate-limited, whitelisted to strategy contracts, revocable any time.",
  },
  {
    id: "fund",
    title: "Fund the vault",
    detail: "Moves your deposit into the keeper wallet so the agent can allocate it.",
  },
] as const;

/** A fresh machine: nothing confirmed, nothing in flight. */
export function initialJourneyProgress(): JourneyProgress {
  return { confirmed: {}, txHashes: {}, activeStepId: null, phase: "idle", error: null };
}

/**
 * What the server's account status proves about the chain, and nothing more.
 *
 * `REVOKED` deliberately does NOT mark `configure_session_key` confirmed: the
 * on-chain key has been revoked, so claiming that step is done would show a
 * green tick over a vault the agent cannot actually act on.
 *
 * An unknown/absent status proves nothing and returns `{}` rather than
 * optimistically assuming step one landed.
 */
export function completionFromAccountStatus(
  status: AccountStatus | null | undefined
): Partial<Record<JourneyStepId, true>> {
  switch (status) {
    case "DEPLOYING":
      return { deploy: true };
    case "AWAITING_FUND":
      return { deploy: true, configure_session_key: true };
    case "ACTIVE":
    case "HALTED":
      return { deploy: true, configure_session_key: true, fund: true };
    case "REVOKED":
      return { deploy: true };
    default:
      return {};
  }
}

/**
 * Transaction hashes recovered from the account's own activity feed.
 *
 * The backend records one `DEPLOY` row for the contract deployment and a second
 * `DEPLOY` row whose detail names the session key, plus a `FUND` row. Reading
 * them back means a returning user's journey shows the real hashes it was
 * signed with instead of three blank links. Rows without a `txHash` are
 * skipped rather than filled in.
 */
export function txHashesFromActivity(
  items: readonly { type: string; detail?: string; txHash?: string }[] | null | undefined
): Partial<Record<JourneyStepId, string>> {
  const out: Partial<Record<JourneyStepId, string>> = {};
  for (const item of items ?? []) {
    if (!item.txHash) continue;
    const type = item.type.toUpperCase();
    const detail = (item.detail ?? "").toLowerCase();
    if (type === "FUND") {
      out.fund ??= item.txHash;
    } else if (type === "DEPLOY") {
      if (detail.includes("session key")) out.configure_session_key ??= item.txHash;
      else out.deploy ??= item.txHash;
    } else if (type === "SETUP" || type === "REACTIVATE") {
      out.configure_session_key ??= item.txHash;
    }
  }
  return out;
}

/**
 * The reducer.
 *
 * Invariants it enforces, each of which has a test:
 *  - `seed` only ever flips a step false → true. A stale server read landing
 *    mid-flow must not un-tick a step the user just signed.
 *  - `fail` never confirms anything. It records the message and leaves the
 *    active step visible so Retry has something to retry.
 *  - a tx hash can be recorded before its step confirms (submitted-but-not-yet
 *    -mined), and confirming without a hash does not erase one already known.
 */
export function journeyReducer(state: JourneyProgress, event: JourneyEvent): JourneyProgress {
  switch (event.type) {
    case "seed": {
      const confirmed = { ...state.confirmed };
      for (const [id, done] of Object.entries(event.confirmed)) {
        if (done) confirmed[id as JourneyStepId] = true;
      }
      return { ...state, confirmed };
    }
    case "start":
      return { ...state, activeStepId: event.stepId, phase: "building", error: null };
    case "phase":
      return { ...state, phase: event.phase };
    case "tx":
      return { ...state, txHashes: { ...state.txHashes, [event.stepId]: event.hash } };
    case "confirm": {
      const txHashes = event.hash
        ? { ...state.txHashes, [event.stepId]: event.hash }
        : state.txHashes;
      return {
        ...state,
        confirmed: { ...state.confirmed, [event.stepId]: true },
        txHashes,
        activeStepId: null,
        phase: "confirmed",
        error: null,
      };
    }
    case "fail":
      return { ...state, phase: "failed", error: event.message };
    case "clearError":
      return { ...state, error: null, phase: state.activeStepId ? "idle" : state.phase };
    case "reset":
      return initialJourneyProgress();
    default:
      return state;
  }
}

/**
 * The step the user should be looking at.
 *
 * An in-flight step wins, unless it has already been confirmed (which happens
 * when a server seed lands while a signature is still open). Otherwise it is
 * the first unconfirmed step. `null` means the whole chain is done.
 */
export function currentJourneyStepId(
  steps: readonly JourneyStepConfig[],
  progress: JourneyProgress
): JourneyStepId | null {
  const active = progress.activeStepId;
  if (active && !progress.confirmed[active] && steps.some((s) => s.id === active)) return active;
  return steps.find((step) => !progress.confirmed[step.id])?.id ?? null;
}

export function isJourneyComplete(
  steps: readonly JourneyStepConfig[],
  progress: JourneyProgress
): boolean {
  return steps.length > 0 && steps.every((step) => progress.confirmed[step.id] === true);
}

/** How many of the configured steps are confirmed. Renders as "2 of 3". */
export function journeyConfirmedCount(
  steps: readonly JourneyStepConfig[],
  progress: JourneyProgress
): number {
  return steps.filter((step) => progress.confirmed[step.id] === true).length;
}

/**
 * Resolve the configured steps into something renderable.
 *
 * `explorerBase` is passed in rather than read from config so this stays pure
 * and so the network the links point at is a decision of the caller. On mainnet
 * it is `https://stellar.expert/explorer/public`.
 */
export function buildJourneyView(
  steps: readonly JourneyStepConfig[],
  progress: JourneyProgress,
  explorerBase: string
): JourneyStepView[] {
  const currentId = currentJourneyStepId(steps, progress);
  return steps.map((step, index) => {
    const txHash = progress.txHashes[step.id] ?? null;
    const isActive = progress.activeStepId === step.id;
    let state: JourneyStepView["state"];
    if (progress.confirmed[step.id]) {
      state = "confirmed";
    } else if (isActive && progress.phase === "failed") {
      state = "failed";
    } else if (
      isActive &&
      (progress.phase === "building" ||
        progress.phase === "signing" ||
        progress.phase === "submitting")
    ) {
      state = "signing";
    } else {
      state = "pending";
    }
    return {
      ...step,
      index,
      state,
      isCurrent: step.id === currentId,
      txHash,
      explorerUrl: txHash ? `${explorerBase}/tx/${txHash}` : null,
    };
  });
}
