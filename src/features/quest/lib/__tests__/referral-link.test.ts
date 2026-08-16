import {
  buildShareUrl,
  buildVerifyPayload,
  clearPendingReferralCode,
  readPendingReferralCode,
} from "../referral-link";

// --- helpers ------------------------------------------------------------------
// Isolate buildShareUrl tests from whatever NEXT_PUBLIC_APP_URL nextJest loads
// from .env.local, so they deterministically exercise window.location.origin.
let savedAppUrl: string | undefined;
beforeEach(() => {
  savedAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
});
afterEach(() => {
  if (savedAppUrl !== undefined) {
    process.env.NEXT_PUBLIC_APP_URL = savedAppUrl;
  } else {
    delete process.env.NEXT_PUBLIC_APP_URL;
  }
});

describe("referral-link", () => {
  // -- buildShareUrl ----------------------------------------------------------

  it("buildShareUrl uses window.location.origin as the base when NEXT_PUBLIC_APP_URL is unset", () => {
    // jsdom sets window.location.origin = "http://localhost"
    expect(buildShareUrl("CODE-A")).toBe("http://localhost/r/CODE-A");
  });

  it("buildShareUrl prefers the current browser origin even when NEXT_PUBLIC_APP_URL is set", () => {
    // In a browser the share link must point at the domain the user is actually
    // on (jsdom origin = "http://localhost"), not a build-time configured URL.
    process.env.NEXT_PUBLIC_APP_URL = "https://app.tasmil-finance.xyz";
    expect(buildShareUrl("CODE-A")).toBe("http://localhost/r/CODE-A");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  // -- readPendingReferralCode ------------------------------------------------

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

  // -- clearPendingReferralCode -----------------------------------------------

  it("clearPendingReferralCode removes the pending code from localStorage", () => {
    localStorage.setItem("tasmil.referral.pendingCode", "CLEAR-ME");
    clearPendingReferralCode();
    expect(localStorage.getItem("tasmil.referral.pendingCode")).toBeNull();
  });

  // -- buildVerifyPayload ----------------------------------------------------

  it("buildVerifyPayload includes referredByCode when present", () => {
    const payload = buildVerifyPayload("pub-key", "sig", "CODE-A");
    expect(payload).toEqual({
      publicKey: "pub-key",
      signedMessage: "sig",
      referredByCode: "CODE-A",
    });
  });

  it("buildVerifyPayload omits referredByCode when null", () => {
    const payload = buildVerifyPayload("pub-key", "sig", null);
    expect(payload).toEqual({ publicKey: "pub-key", signedMessage: "sig" });
    expect("referredByCode" in payload).toBe(false);
  });
});
