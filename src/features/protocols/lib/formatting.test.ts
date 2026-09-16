import {
  cleanVaultName,
  fmt,
  fmtAmount,
  fmtGas,
  formatNumber,
  formatPercent,
  formatPrice,
  formatTokenAmount,
  pct,
  resolveSymbol,
  trunc,
} from "./formatting";

// NOTE: this file previously tested a `toNumberish` export that does not exist
// in ./formatting (and is unused anywhere in the app) — every run threw
// "toNumberish is not a function". It has been repointed to cover the module's
// actual public API, which is what a colocated formatting.test.ts should verify.

const DASH = "—"; // — returned for non-finite inputs

describe("formatting", () => {
  describe("fmt", () => {
    it("abbreviates K/M/B/T and honours decimals", () => {
      expect(fmt(1500)).toBe("1.50K");
      expect(fmt(2_500_000)).toBe("2.50M");
      expect(fmt(1_000_000_000)).toBe("1.00B");
      expect(fmt(1e12)).toBe("1.00T");
      expect(fmt(0.125, 3)).toBe("0.125");
    });
    it("returns an em dash for non-finite values", () => {
      expect(fmt(Number.NaN)).toBe(DASH);
      expect(fmt("not-a-number")).toBe(DASH);
    });
  });

  describe("pct", () => {
    it("auto-detects 0-1 vs 0-100 ranges", () => {
      expect(pct(0.1234)).toBe("12.34%");
      expect(pct(50)).toBe("50.00%");
    });
    it("returns an em dash for non-finite values", () => {
      expect(pct(Number.NaN)).toBe(DASH);
    });
  });

  describe("trunc", () => {
    it("keeps short strings and truncates long ones", () => {
      expect(trunc("SHORT")).toBe("SHORT");
      expect(trunc("GABCDEFHIJKLMNOP", 6, 4)).toBe("GABCDE…MNOP");
    });
  });

  describe("formatNumber", () => {
    it("handles null/undefined/NaN and formats numbers", () => {
      expect(formatNumber(null)).toBe("N/A");
      expect(formatNumber(undefined)).toBe("N/A");
      expect(formatNumber("abc")).toBe("N/A");
      expect(formatNumber("1500")).toBe("1.50K");
    });
  });

  describe("formatPrice", () => {
    it("uses dynamic precision by magnitude", () => {
      expect(formatPrice(null)).toBe("N/A");
      expect(formatPrice(0.005)).toBe("0.005000");
      expect(formatPrice(0.5)).toBe("0.5000");
      expect(formatPrice(1234.5)).toBe("1,234.50");
    });
  });

  describe("formatPercent", () => {
    it("scales fractions to percentages", () => {
      expect(formatPercent(0.05)).toBe("5.00%");
      expect(formatPercent("0.1")).toBe("10.00%");
      expect(formatPercent(null)).toBe(DASH);
    });
  });

  describe("formatTokenAmount", () => {
    it("converts raw integer amounts by decimals", () => {
      expect(formatTokenAmount("10000000", 7)).toBe("1");
      expect(formatTokenAmount("500000", 7)).toBe("0.05");
      expect(formatTokenAmount(null, 7)).toBe("N/A");
    });
  });

  describe("fmtAmount / fmtGas", () => {
    it("formats stroops", () => {
      expect(fmtAmount("10000000", 7)).toBe("1.0000");
      expect(fmtGas("1000000")).toBe("0.1000000 XLM");
    });
  });

  describe("resolveSymbol", () => {
    it("maps known contracts and abbreviates unknown long ids", () => {
      expect(resolveSymbol("CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA")).toBe("XLM");
      expect(resolveSymbol("SHORT")).toBe("SHORT");
      expect(resolveSymbol("CUNKNOWNCONTRACT123")).toBe("CUNKNO...");
    });
  });

  describe("cleanVaultName", () => {
    it("strips the DeFindex-Vault- prefix", () => {
      expect(cleanVaultName("DeFindex-Vault-USDC")).toBe("USDC");
      expect(cleanVaultName("PlainName")).toBe("PlainName");
    });
  });
});
