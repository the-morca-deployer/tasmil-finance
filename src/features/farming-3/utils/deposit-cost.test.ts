import {
  DEPOSIT_ROUNDING_COST,
  economicAmountAt,
  formatEarnBackTime,
  hoursToEarnBackDepositCost,
  isDepositUneconomic,
  UNECONOMIC_HOURS,
} from "./deposit-cost";

describe("hoursToEarnBackDepositCost", () => {
  // The measurement this whole module exists for: 1.5 USDC at 6.5% APY
  // accrued 0.0000487 USDC in 4.4 hours on mainnet, against a fixed
  // 0.0001 USDC deposit-rounding cost - about nine hours of yield.
  it("reproduces the measured mainnet case (~9 hours at 1.5 USDC / 6.5%)", () => {
    const hours = hoursToEarnBackDepositCost(1.5, 0.065);
    expect(hours).not.toBeNull();
    expect(hours as number).toBeGreaterThan(8);
    expect(hours as number).toBeLessThan(10);
  });

  it("scales inversely with the amount", () => {
    const small = hoursToEarnBackDepositCost(1.5, 0.065) as number;
    const large = hoursToEarnBackDepositCost(150, 0.065) as number;
    expect(large).toBeCloseTo(small / 100, 6);
  });

  it("scales inversely with the rate, so the same amount can be fine or not", () => {
    const lowRate = hoursToEarnBackDepositCost(10, 0.005) as number;
    const highRate = hoursToEarnBackDepositCost(10, 0.05) as number;
    expect(lowRate).toBeCloseTo(highRate * 10, 6);
  });

  it("returns null rather than a number when either input is unknown", () => {
    expect(hoursToEarnBackDepositCost(null, 0.065)).toBeNull();
    expect(hoursToEarnBackDepositCost(1.5, null)).toBeNull();
    expect(hoursToEarnBackDepositCost(1.5, undefined)).toBeNull();
    expect(hoursToEarnBackDepositCost(Number.NaN, 0.065)).toBeNull();
  });

  it("treats a zero or negative rate as unknown, not as instant payback", () => {
    expect(hoursToEarnBackDepositCost(1.5, 0)).toBeNull();
    expect(hoursToEarnBackDepositCost(1.5, -0.01)).toBeNull();
  });
});

describe("isDepositUneconomic", () => {
  it("flags the measured 1.5 USDC / 6.5% deposit", () => {
    expect(isDepositUneconomic(1.5, 0.065)).toBe(true);
  });

  it("does not flag a size whose cost is earned back quickly", () => {
    expect(isDepositUneconomic(100, 0.065)).toBe(false);
  });

  it("is driven by the rate, not by the amount alone", () => {
    // Same 10 units: fine at 12%, not at 0.05% (the real XLM lending rate
    // seen on `GET /api/pools` is that low).
    expect(isDepositUneconomic(10, 0.12)).toBe(false);
    expect(isDepositUneconomic(10, 0.0005)).toBe(true);
  });

  it("says nothing when the rate is unreadable", () => {
    expect(isDepositUneconomic(1.5, null)).toBe(false);
  });
});

describe("economicAmountAt", () => {
  it("names the size whose cost is earned back inside the threshold", () => {
    const amount = economicAmountAt(0.065) as number;
    expect(amount).not.toBeNull();
    const hours = hoursToEarnBackDepositCost(amount, 0.065) as number;
    expect(hours).toBeCloseTo(UNECONOMIC_HOURS, 6);
    expect(isDepositUneconomic(amount * 1.01, 0.065)).toBe(false);
  });

  it("returns null when there is no rate to derive it from", () => {
    expect(economicAmountAt(null)).toBeNull();
    expect(economicAmountAt(0)).toBeNull();
  });
});

describe("formatEarnBackTime", () => {
  it("renders hours, minutes and days in the unit a person would use", () => {
    expect(formatEarnBackTime(9)).toBe("about 9 hours");
    expect(formatEarnBackTime(1)).toBe("about 1 hour");
    expect(formatEarnBackTime(0.5)).toBe("about 30 minutes");
    expect(formatEarnBackTime(72)).toBe("about 3 days");
  });

  it("renders nothing for an unknown duration", () => {
    expect(formatEarnBackTime(null)).toBeNull();
    expect(formatEarnBackTime(0)).toBeNull();
  });
});

describe("DEPOSIT_ROUNDING_COST", () => {
  it("is the measured mainnet figure, in units of the deposited token", () => {
    expect(DEPOSIT_ROUNDING_COST).toBe(0.0001);
  });
});
