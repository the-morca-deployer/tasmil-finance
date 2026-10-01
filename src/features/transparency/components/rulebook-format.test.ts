import {
  assetSymbol,
  formatTokenAmount,
  ledgersToDuration,
  shortAddress,
  usedPercent,
} from "./rulebook-format";

describe("rulebook-format", () => {
  it("converts base units with 7 decimals and groups thousands", () => {
    expect(formatTokenAmount("100000000")).toBe("10");
    expect(formatTokenAmount("1000000000")).toBe("100");
    expect(formatTokenAmount("0")).toBe("0");
    expect(formatTokenAmount("12345678901")).toBe("1,234.5678901");
    expect(formatTokenAmount("5")).toBe("0.0000005");
  });

  it("names known asset contracts and passes symbols through", () => {
    expect(assetSymbol("CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA")).toBe("XLM");
    expect(assetSymbol("USDC")).toBe("USDC");
    expect(assetSymbol(`C${"A".repeat(55)}`)).toBeNull();
  });

  it("shortens long addresses only", () => {
    expect(shortAddress("CAWBQPESFRFTIKBARVYIX6SCQV6B5FDM6ZCNVX6E5ZEYLKPN7T4IUAQ6")).toBe(
      "CAWB...UAQ6"
    );
    expect(shortAddress("CVENUE")).toBe("CVENUE");
  });

  it("turns ledger counts into approximate durations", () => {
    expect(ledgersToDuration(515_050n)).toBe("~30 days");
    expect(ledgersToDuration(17_280n)).toBe("~1 day");
    expect(ledgersToDuration(20n)).toBe("~2 min");
    expect(ledgersToDuration(0n)).toBe("now");
  });

  it("computes a clamped usage percentage", () => {
    expect(usedPercent("0", "1000")).toBe(0);
    expect(usedPercent("250", "1000")).toBe(25);
    expect(usedPercent("2000", "1000")).toBe(100);
    expect(usedPercent("5", "0")).toBe(0);
  });
});
