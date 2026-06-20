import { APP_ENTRY, gateDecision, isPublicPath, isStaticAsset, isWaitlistMode } from "./waitlist-mode";

describe("isWaitlistMode", () => {
  const original = process.env.NEXT_PUBLIC_WAITLIST_MODE;
  afterEach(() => {
    process.env.NEXT_PUBLIC_WAITLIST_MODE = original;
  });

  it("is true when NEXT_PUBLIC_WAITLIST_MODE === 'true'", () => {
    process.env.NEXT_PUBLIC_WAITLIST_MODE = "true";
    expect(isWaitlistMode()).toBe(true);
  });

  it("is false when NEXT_PUBLIC_WAITLIST_MODE === 'false'", () => {
    process.env.NEXT_PUBLIC_WAITLIST_MODE = "false";
    expect(isWaitlistMode()).toBe(false);
  });

  it("is false when the flag is unset", () => {
    delete process.env.NEXT_PUBLIC_WAITLIST_MODE;
    expect(isWaitlistMode()).toBe(false);
  });
});

describe("isPublicPath", () => {
  it("treats the landing root as public", () => {
    expect(isPublicPath("/")).toBe(true);
  });

  it("treats /waitlist and /access as public", () => {
    expect(isPublicPath("/waitlist")).toBe(true);
    expect(isPublicPath("/access")).toBe(true);
  });

  it("treats referral links (/r/<code>) as public", () => {
    expect(isPublicPath("/r/ABCD1234")).toBe(true);
  });

  it("treats app routes as NOT public", () => {
    expect(isPublicPath("/chat")).toBe(false);
    expect(isPublicPath("/farming")).toBe(false);
    expect(isPublicPath("/dashboard")).toBe(false);
  });
});

describe("isStaticAsset", () => {
  it("matches framework/api paths", () => {
    expect(isStaticAsset("/_next/static/chunk.js")).toBe(true);
    expect(isStaticAsset("/api/auth/me")).toBe(true);
    expect(isStaticAsset("/favicon.ico")).toBe(true);
  });

  it("matches public asset files (the ones the gate was wrongly 307-ing)", () => {
    expect(isStaticAsset("/tasmil-logo.png")).toBe(true);
    expect(isStaticAsset("/partners/blend.svg")).toBe(true);
    expect(isStaticAsset("/tokens/usdc.svg")).toBe(true);
    expect(isStaticAsset("/tasmil-coins.webm")).toBe(true);
  });

  it("does NOT match real page routes", () => {
    expect(isStaticAsset("/chat")).toBe(false);
    expect(isStaticAsset("/waitlist")).toBe(false);
  });
});

describe("APP_ENTRY", () => {
  it("points at /chat", () => {
    expect(APP_ENTRY).toBe("/chat");
  });
});

describe("gateDecision", () => {
  const original = process.env.NEXT_PUBLIC_WAITLIST_MODE;
  afterEach(() => {
    process.env.NEXT_PUBLIC_WAITLIST_MODE = original;
  });
  const off = () => (process.env.NEXT_PUBLIC_WAITLIST_MODE = "false");
  const on = () => (process.env.NEXT_PUBLIC_WAITLIST_MODE = "true");
  const decide = (pathname: string, extra: Partial<{ hasAuthCookie: boolean; devBypass: boolean }> = {}) =>
    gateDecision({ pathname, hasAuthCookie: false, devBypass: false, ...extra });

  describe("waitlist OFF", () => {
    beforeEach(off);
    it("redirects /waitlist to the app entry", () => {
      expect(decide("/waitlist")).toBe(APP_ENTRY);
    });
    it("redirects /access to the app entry", () => {
      expect(decide("/access")).toBe(APP_ENTRY);
    });
    it("lets app routes through without auth (connect in-app)", () => {
      expect(decide("/chat")).toBeNull();
      expect(decide("/farming")).toBeNull();
    });
  });

  describe("waitlist ON", () => {
    beforeEach(on);
    it("keeps /waitlist and /access reachable (public)", () => {
      expect(decide("/waitlist")).toBeNull();
      expect(decide("/access")).toBeNull();
    });
    it("gates app routes without the auth cookie back to /", () => {
      expect(decide("/chat")).toBe("/");
    });
    it("allows app routes with the auth cookie", () => {
      expect(decide("/chat", { hasAuthCookie: true })).toBeNull();
    });
    it("allows app routes when dev-bypass is active", () => {
      expect(decide("/chat", { devBypass: true })).toBeNull();
    });
  });

  describe("always allowed (either mode)", () => {
    beforeEach(on); // strictest mode
    it("never gates static assets", () => {
      expect(decide("/partners/blend.svg")).toBeNull();
      expect(decide("/tasmil-logo.png")).toBeNull();
      expect(decide("/_next/static/x.js")).toBeNull();
    });
    it("never gates root / admin / quest (own auth)", () => {
      expect(decide("/")).toBeNull();
      expect(decide("/admin/dashboard")).toBeNull();
      expect(decide("/quest")).toBeNull();
    });
  });
});
