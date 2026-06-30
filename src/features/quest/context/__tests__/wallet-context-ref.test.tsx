/**
 * Seam choice: wallet-context.tsx drives the full authentication flow via
 * StellarWalletsKit (dynamic import), @stellar/freighter-api, Zustand stores,
 * and generated TanStack Query hooks. Mounting the provider and driving
 * authenticateWithWallet through all those layers in jsdom is impractical to
 * mock reliably.
 *
 * Instead we test at the smallest verifiable seam: `buildVerifyPayload`, the
 * pure function extracted from wallet-context.tsx that constructs the
 * /api/auth/verify request body. wallet-context.tsx calls it directly, so
 * correctness here guarantees the payload shape on the wire.
 */

import { buildVerifyPayload, readPendingReferralCode } from "@/features/quest/lib/referral-link";

describe("wallet-context — verify payload includes referredByCode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("payload contains referredByCode when localStorage has a pending code", () => {
    localStorage.setItem("tasmil.referral.pendingCode", "CODE-A");
    const code = readPendingReferralCode();
    const payload = buildVerifyPayload("G-PUBLIC-KEY", "signed-msg", code);
    expect(payload).toEqual({
      publicKey: "G-PUBLIC-KEY",
      signedMessage: "signed-msg",
      referredByCode: "CODE-A",
    });
  });

  it("payload omits referredByCode when no pending code is stored", () => {
    const code = readPendingReferralCode();
    const payload = buildVerifyPayload("G-PUBLIC-KEY", "signed-msg", code);
    expect(payload).toEqual({ publicKey: "G-PUBLIC-KEY", signedMessage: "signed-msg" });
    expect("referredByCode" in payload).toBe(false);
  });

  it("passes the code verbatim without transforming case", () => {
    localStorage.setItem("tasmil.referral.pendingCode", "abc-123");
    const code = readPendingReferralCode();
    const payload = buildVerifyPayload("G-PUBLIC-KEY", "signed-msg", code);
    expect((payload as { referredByCode: string }).referredByCode).toBe("abc-123");
  });
});
