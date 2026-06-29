import { buildShareUrl, buildVerifyPayload, readPendingReferralCode } from "../referral-link";

describe("referral-link", () => {
  // ── buildShareUrl ──────────────────────────────────────────────────────────

  it("buildShareUrl returns the canonical /r/ url", () => {
    expect(buildShareUrl("CODE-A")).toBe("https://tasmil.finance/r/CODE-A");
  });

  // ── readPendingReferralCode ────────────────────────────────────────────────

  it("readPendingReferralCode falls back to localStorage", () => {
    localStorage.clear();
    localStorage.setItem("tasmil.referral.pendingCode", "FROM-LS");
    expect(readPendingReferralCode()).toBe("FROM-LS");
  });

  it("returns null when nothing is set", () => {
    localStorage.clear();
    expect(readPendingReferralCode()).toBeNull();
  });

  it("prefers ?ref= query param over localStorage", () => {
    localStorage.setItem("tasmil.referral.pendingCode", "FROM-LS");
    Object.defineProperty(window, "location", {
      value: { search: "?ref=FROM-QUERY" },
      writable: true,
      configurable: true,
    });
    expect(readPendingReferralCode()).toBe("FROM-QUERY");
    // restore
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
      configurable: true,
    });
  });

  // ── buildVerifyPayload ────────────────────────────────────────────────────

  it("buildVerifyPayload includes referredByCode when present", () => {
    const payload = buildVerifyPayload("pub-key", "sig", "CODE-A");
    expect(payload).toEqual({ publicKey: "pub-key", signedMessage: "sig", referredByCode: "CODE-A" });
  });

  it("buildVerifyPayload omits referredByCode when null", () => {
    const payload = buildVerifyPayload("pub-key", "sig", null);
    expect(payload).toEqual({ publicKey: "pub-key", signedMessage: "sig" });
    expect("referredByCode" in payload).toBe(false);
  });
});
