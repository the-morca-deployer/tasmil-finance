import {
  formatAmount,
  formatApy,
  formatPercentPoints,
  formatSignedUsd,
  formatTimestamp,
  formatTvl,
  formatUsd,
  NO_DATA,
  shortAddress,
  shortHash,
  titleCase,
} from "./format";

describe("formatApy — the 100x bug guard", () => {
  // Live values read from GET /api/account/position/GCQRJ4AL… on 2026-08-17.
  it("renders the live Blend leg rate as 6.71%, not 0.07%", () => {
    expect(formatApy(0.06706519105778486)).toBe("6.71%");
  });

  it("renders the live portfolio rate as 7.00%, not 0.07%", () => {
    expect(formatApy(0.07)).toBe("7.00%");
  });

  it("renders the live XLM pool rate at full precision when asked", () => {
    expect(formatApy(0.0005816895999485715, 3)).toBe("0.058%");
  });

  it("keeps a measured zero visible as a real zero", () => {
    expect(formatApy(0)).toBe("0.00%");
  });

  it("refuses to render an absent rate as zero", () => {
    expect(formatApy(undefined)).toBe(NO_DATA);
    expect(formatApy(null)).toBe(NO_DATA);
    expect(formatApy(Number.NaN)).toBe(NO_DATA);
  });
});

describe("formatUsd / formatSignedUsd", () => {
  it("formats the live position value", () => {
    expect(formatUsd(1.5)).toBe("$1.50");
  });

  it("distinguishes measured zero from absent", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(undefined)).toBe(NO_DATA);
    expect(formatUsd(null)).toBe(NO_DATA);
  });

  it("signs P&L, leaving a true zero unsigned", () => {
    expect(formatSignedUsd(1.23)).toBe("+$1.23");
    expect(formatSignedUsd(-1.23)).toBe("-$1.23");
    expect(formatSignedUsd(0)).toBe("$0.00");
    expect(formatSignedUsd(undefined)).toBe(NO_DATA);
  });
});

describe("formatPercentPoints", () => {
  // profitPercent is already in points; multiplying it would be the mirror
  // image of the APY bug.
  it("does not multiply an already-percent value", () => {
    expect(formatPercentPoints(0.41)).toBe("0.41%");
    expect(formatPercentPoints(0)).toBe("0.00%");
    expect(formatPercentPoints(undefined)).toBe(NO_DATA);
  });
});

describe("formatAmount", () => {
  it("keeps sub-unit balances instead of rounding money to zero", () => {
    expect(formatAmount(0.0004)).toBe("0.0004");
    expect(formatAmount(0.00000012)).toBe("0.00000012");
  });

  it("abbreviates large amounts", () => {
    expect(formatAmount(1500)).toBe("1.5K");
    expect(formatAmount(2_500_000)).toBe("2.50M");
  });

  it("passes absent through", () => {
    expect(formatAmount(undefined)).toBe(NO_DATA);
  });
});

describe("formatTvl", () => {
  it("abbreviates the live pool TVLs", () => {
    expect(formatTvl(120540233.95105666)).toBe("$120.5M");
    expect(formatTvl(63636713.9814205)).toBe("$63.6M");
  });

  it("passes absent through", () => {
    expect(formatTvl(null)).toBe(NO_DATA);
  });
});

describe("shortAddress / shortHash", () => {
  it("shortens the live keeper address", () => {
    expect(shortAddress("CDALQPJ4IPYKEM52ZB7QKCUAOIOFNVQ2V4AXPNWERJS565WTSSZPQSL4")).toBe(
      "CDAL…QSL4"
    );
  });

  it("shortens a tx hash with a wider edge", () => {
    expect(shortHash("da0a3fac04ad2c21431d8169a9cf8bc9d1b649aed4b350f6fc29fa678b40689f")).toBe(
      "da0a3f…40689f"
    );
  });

  it("returns the placeholder rather than a stray ellipsis for absent input", () => {
    expect(shortAddress(undefined)).toBe(NO_DATA);
    expect(shortAddress("")).toBe(NO_DATA);
  });

  it("leaves short strings alone", () => {
    expect(shortAddress("abc")).toBe("abc");
  });
});

describe("formatTimestamp", () => {
  it("formats a real ISO timestamp", () => {
    expect(formatTimestamp("2026-08-16T21:36:12.712Z")).toMatch(/Aug\s+1[67],/);
  });

  // Defaulting a missing date to `new Date()` would print "now" over a row
  // whose time is unknown.
  it("never substitutes the current time for a missing one", () => {
    expect(formatTimestamp(undefined)).toBe(NO_DATA);
    expect(formatTimestamp(null)).toBe(NO_DATA);
    expect(formatTimestamp("")).toBe(NO_DATA);
    expect(formatTimestamp("not-a-date")).toBe(NO_DATA);
  });
});

describe("titleCase", () => {
  it("normalises backend enum casing", () => {
    expect(titleCase("BALANCED")).toBe("Balanced");
    expect(titleCase("blend")).toBe("Blend");
    expect(titleCase("configure_session_key")).toBe("Configure Session Key");
  });

  it("passes absent through", () => {
    expect(titleCase(undefined)).toBe(NO_DATA);
  });
});
