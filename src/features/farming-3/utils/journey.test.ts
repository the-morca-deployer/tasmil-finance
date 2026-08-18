import type { JourneyProgress, JourneyStepConfig } from "../types";
import {
  buildJourneyView,
  completionFromAccountStatus,
  currentJourneyStepId,
  initialJourneyProgress,
  isJourneyComplete,
  JOURNEY_STEPS,
  journeyConfirmedCount,
  journeyReducer,
  txHashesFromActivity,
} from "./journey";

const EXPLORER = "https://stellar.expert/explorer/public";
const HASH_DEPLOY = "da0a3fac04ad2c21431d8169a9cf8bc9d1b649aed4b350f6fc29fa678b40689f";
const HASH_SETUP = "f39c995883fe1171af090ad2342e99a5b0254e66b5950c952d2339f3d317feb8";
const HASH_FUND = "c72481328845d089d811c8c34ba8f9f869503b3f14faddffd1838517b495b8a2";

/** Runs a list of events through the reducer from a given starting point. */
function run(events: Parameters<typeof journeyReducer>[1][], from = initialJourneyProgress()) {
  return events.reduce(journeyReducer, from);
}

describe("JOURNEY_STEPS config", () => {
  it("is the three mainnet signatures, in signing order", () => {
    expect(JOURNEY_STEPS.map((s) => s.id)).toEqual(["deploy", "configure_session_key", "fund"]);
  });

  it("gives every step user-facing copy", () => {
    for (const step of JOURNEY_STEPS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });

  // The frame must not hard-code three. Collapsing deploy + configure into one
  // signature has to be an edit to the list and nothing else.
  it("renders a collapsed two-step chain without any other change", () => {
    const collapsed: JourneyStepConfig[] = [
      { id: "deploy", title: "Deploy + configure", detail: "One signature." },
      { id: "fund", title: "Fund", detail: "Move the deposit in." },
    ];
    const progress = run([{ type: "confirm", stepId: "deploy", hash: HASH_DEPLOY }]);
    const view = buildJourneyView(collapsed, progress, EXPLORER);

    expect(view).toHaveLength(2);
    expect(view[0]?.state).toBe("confirmed");
    expect(view[1]?.state).toBe("pending");
    expect(view[1]?.isCurrent).toBe(true);
    expect(currentJourneyStepId(collapsed, progress)).toBe("fund");
    expect(journeyConfirmedCount(collapsed, progress)).toBe(1);
  });
});

describe("completionFromAccountStatus", () => {
  it("treats DEPLOYING as step 1 done only", () => {
    expect(completionFromAccountStatus("DEPLOYING")).toEqual({ deploy: true });
  });

  it("treats AWAITING_FUND as steps 1 and 2 done", () => {
    expect(completionFromAccountStatus("AWAITING_FUND")).toEqual({
      deploy: true,
      configure_session_key: true,
    });
  });

  it.each(["ACTIVE", "HALTED"] as const)("treats %s as the whole chain done", (status) => {
    expect(completionFromAccountStatus(status)).toEqual({
      deploy: true,
      configure_session_key: true,
      fund: true,
    });
  });

  // A revoked key means the agent cannot act. Ticking step 2 would put a green
  // check over a vault that is not actually delegated.
  it("does not mark the session key done when it has been revoked", () => {
    expect(completionFromAccountStatus("REVOKED")).toEqual({ deploy: true });
  });

  it("claims nothing when the status is unknown", () => {
    expect(completionFromAccountStatus(undefined)).toEqual({});
    expect(completionFromAccountStatus(null)).toEqual({});
  });
});

describe("journeyReducer", () => {
  it("starts empty", () => {
    expect(initialJourneyProgress()).toEqual({
      confirmed: {},
      txHashes: {},
      activeStepId: null,
      phase: "idle",
      error: null,
    });
  });

  it("walks a step through building → signing → submitting → confirmed", () => {
    const states: string[] = [];
    let s = initialJourneyProgress();
    s = journeyReducer(s, { type: "start", stepId: "deploy" });
    states.push(s.phase);
    s = journeyReducer(s, { type: "phase", phase: "signing" });
    states.push(s.phase);
    s = journeyReducer(s, { type: "phase", phase: "submitting" });
    states.push(s.phase);
    s = journeyReducer(s, { type: "confirm", stepId: "deploy", hash: HASH_DEPLOY });
    states.push(s.phase);

    expect(states).toEqual(["building", "signing", "submitting", "confirmed"]);
    expect(s.confirmed.deploy).toBe(true);
    expect(s.txHashes.deploy).toBe(HASH_DEPLOY);
    expect(s.activeStepId).toBeNull();
  });

  it("records a tx hash before the step confirms", () => {
    const s = run([
      { type: "start", stepId: "fund" },
      { type: "tx", stepId: "fund", hash: HASH_FUND },
    ]);
    expect(s.txHashes.fund).toBe(HASH_FUND);
    expect(s.confirmed.fund).toBeUndefined();
  });

  it("keeps a known hash when confirm arrives without one", () => {
    const s = run([
      { type: "start", stepId: "fund" },
      { type: "tx", stepId: "fund", hash: HASH_FUND },
      { type: "confirm", stepId: "fund" },
    ]);
    expect(s.txHashes.fund).toBe(HASH_FUND);
    expect(s.confirmed.fund).toBe(true);
  });

  it("does not confirm anything on failure and keeps the step retryable", () => {
    const s = run([
      { type: "start", stepId: "configure_session_key" },
      { type: "phase", phase: "signing" },
      { type: "fail", message: "User rejected transaction signing" },
    ]);
    expect(s.confirmed.configure_session_key).toBeUndefined();
    expect(s.activeStepId).toBe("configure_session_key");
    expect(s.phase).toBe("failed");
    expect(s.error).toBe("User rejected transaction signing");
  });

  it("clears the error without clearing progress", () => {
    const s = run([
      { type: "confirm", stepId: "deploy", hash: HASH_DEPLOY },
      { type: "start", stepId: "configure_session_key" },
      { type: "fail", message: "boom" },
      { type: "clearError" },
    ]);
    expect(s.error).toBeNull();
    expect(s.confirmed.deploy).toBe(true);
  });

  // A stale server read landing mid-flow must never un-tick a step the user
  // just signed for.
  it("seeds completion additively and never un-confirms", () => {
    const s = run([
      { type: "confirm", stepId: "deploy", hash: HASH_DEPLOY },
      { type: "confirm", stepId: "configure_session_key", hash: HASH_SETUP },
      { type: "seed", confirmed: completionFromAccountStatus("DEPLOYING") },
    ]);
    expect(s.confirmed.deploy).toBe(true);
    expect(s.confirmed.configure_session_key).toBe(true);
  });

  it("seeds from an ACTIVE account in one go", () => {
    const s = journeyReducer(initialJourneyProgress(), {
      type: "seed",
      confirmed: completionFromAccountStatus("ACTIVE"),
    });
    expect(isJourneyComplete(JOURNEY_STEPS, s)).toBe(true);
  });

  it("resets to a fresh machine", () => {
    const s = run([{ type: "confirm", stepId: "deploy", hash: HASH_DEPLOY }, { type: "reset" }]);
    expect(s).toEqual(initialJourneyProgress());
  });
});

describe("currentJourneyStepId", () => {
  it("is the first step on a fresh machine", () => {
    expect(currentJourneyStepId(JOURNEY_STEPS, initialJourneyProgress())).toBe("deploy");
  });

  it("advances past confirmed steps", () => {
    const s = run([{ type: "confirm", stepId: "deploy" }]);
    expect(currentJourneyStepId(JOURNEY_STEPS, s)).toBe("configure_session_key");
  });

  it("prefers the in-flight step", () => {
    const s = run([{ type: "start", stepId: "fund" }]);
    expect(currentJourneyStepId(JOURNEY_STEPS, s)).toBe("fund");
  });

  // Server seed lands while a signature is still open: the open step is done,
  // so "current" must move on rather than point at a finished step.
  it("ignores an in-flight step the server has already confirmed", () => {
    const s = run([
      { type: "start", stepId: "deploy" },
      { type: "seed", confirmed: { deploy: true } },
    ]);
    expect(currentJourneyStepId(JOURNEY_STEPS, s)).toBe("configure_session_key");
  });

  it("is null once every step is confirmed", () => {
    const s = journeyReducer(initialJourneyProgress(), {
      type: "seed",
      confirmed: completionFromAccountStatus("ACTIVE"),
    });
    expect(currentJourneyStepId(JOURNEY_STEPS, s)).toBeNull();
    expect(journeyConfirmedCount(JOURNEY_STEPS, s)).toBe(3);
  });
});

describe("buildJourneyView", () => {
  it("marks pending / signing / pending across the chain mid-flow", () => {
    const s = run([
      { type: "confirm", stepId: "deploy", hash: HASH_DEPLOY },
      { type: "start", stepId: "configure_session_key" },
      { type: "phase", phase: "signing" },
    ]);
    const view = buildJourneyView(JOURNEY_STEPS, s, EXPLORER);
    expect(view.map((v) => v.state)).toEqual(["confirmed", "signing", "pending"]);
    expect(view.map((v) => v.isCurrent)).toEqual([false, true, false]);
    expect(view.map((v) => v.index)).toEqual([0, 1, 2]);
  });

  it("marks the active step failed without touching its neighbours", () => {
    const s = run([
      { type: "confirm", stepId: "deploy", hash: HASH_DEPLOY },
      { type: "start", stepId: "configure_session_key" },
      { type: "fail", message: "declined" },
    ]);
    expect(buildJourneyView(JOURNEY_STEPS, s, EXPLORER).map((v) => v.state)).toEqual([
      "confirmed",
      "failed",
      "pending",
    ]);
  });

  it("builds an explorer link only for steps whose hash is known", () => {
    const s = run([{ type: "confirm", stepId: "deploy", hash: HASH_DEPLOY }]);
    const view = buildJourneyView(JOURNEY_STEPS, s, EXPLORER);
    expect(view[0]?.txHash).toBe(HASH_DEPLOY);
    expect(view[0]?.explorerUrl).toBe(`${EXPLORER}/tx/${HASH_DEPLOY}`);
    // No hash known yet: null, never an empty-tailed URL.
    expect(view[1]?.txHash).toBeNull();
    expect(view[1]?.explorerUrl).toBeNull();
  });

  it("links a submitted step even before it confirms", () => {
    const s = run([
      { type: "start", stepId: "deploy" },
      { type: "phase", phase: "submitting" },
      { type: "tx", stepId: "deploy", hash: HASH_DEPLOY },
    ]);
    const view = buildJourneyView(JOURNEY_STEPS, s, EXPLORER);
    expect(view[0]?.state).toBe("signing");
    expect(view[0]?.explorerUrl).toBe(`${EXPLORER}/tx/${HASH_DEPLOY}`);
  });
});

describe("txHashesFromActivity", () => {
  // Shape taken verbatim from GET /api/account/activity for the live mainnet
  // wallet GCQRJ4AL… on 2026-08-17.
  const ACTIVITY = [
    { type: "REBALANCE", detail: "Initial allocation: 1 deposits succeeded, 0 failed" },
    { type: "DEPOSIT", detail: "Initial deposit: 1.5000 USDC into BLEND/USDC" },
    { type: "FUND", detail: "Deposited 1.5 USDC", txHash: HASH_FUND },
    { type: "DEPLOY", detail: "Session key configured - vault ready to fund", txHash: HASH_SETUP },
    { type: "DEPLOY", detail: "deploy transaction confirmed", txHash: HASH_DEPLOY },
    { type: "DEPLOY", detail: "Deploying keeper wallet CDALQ…" },
  ];

  it("maps the two DEPLOY rows and the FUND row onto the right steps", () => {
    expect(txHashesFromActivity(ACTIVITY)).toEqual({
      deploy: HASH_DEPLOY,
      configure_session_key: HASH_SETUP,
      fund: HASH_FUND,
    });
  });

  it("skips rows with no hash rather than inventing one", () => {
    expect(
      txHashesFromActivity([{ type: "DEPLOY", detail: "deploy transaction confirmed" }])
    ).toEqual({});
  });

  it("returns nothing for absent activity", () => {
    expect(txHashesFromActivity(undefined)).toEqual({});
    expect(txHashesFromActivity(null)).toEqual({});
    expect(txHashesFromActivity([])).toEqual({});
  });

  it("keeps the newest hash when a step has several (feed is newest-first)", () => {
    const hashes = txHashesFromActivity([
      { type: "FUND", detail: "Deposited 2 USDC", txHash: "newer" },
      { type: "FUND", detail: "Deposited 1.5 USDC", txHash: HASH_FUND },
    ]);
    expect(hashes.fund).toBe("newer");
  });

  it("treats SETUP and REACTIVATE rows as the session-key step", () => {
    expect(txHashesFromActivity([{ type: "SETUP", txHash: HASH_SETUP }])).toEqual({
      configure_session_key: HASH_SETUP,
    });
    expect(txHashesFromActivity([{ type: "REACTIVATE", txHash: HASH_SETUP }])).toEqual({
      configure_session_key: HASH_SETUP,
    });
  });

  // The whole point of reading the feed back: a returning ACTIVE account shows
  // three real links, not three ticks with nothing behind them.
  it("gives a returning ACTIVE account a complete, linked journey", () => {
    const progress: JourneyProgress = {
      ...initialJourneyProgress(),
      confirmed: completionFromAccountStatus("ACTIVE"),
      txHashes: txHashesFromActivity(ACTIVITY),
    };
    const view = buildJourneyView(JOURNEY_STEPS, progress, EXPLORER);
    expect(view.every((v) => v.state === "confirmed")).toBe(true);
    expect(view.map((v) => v.explorerUrl)).toEqual([
      `${EXPLORER}/tx/${HASH_DEPLOY}`,
      `${EXPLORER}/tx/${HASH_SETUP}`,
      `${EXPLORER}/tx/${HASH_FUND}`,
    ]);
  });
});
