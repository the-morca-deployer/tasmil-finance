import { fmtInt, fmtPercent, fmtUsdCompact } from "../lib/format";

describe("fmtUsdCompact", () => {
  it("formats millions with one decimal", () => {
    expect(fmtUsdCompact(1_240_000)).toBe("$1.2M");
  });

  it("formats thousands with one decimal", () => {
    expect(fmtUsdCompact(125_040)).toBe("$125.0k");
  });

  it("formats sub-thousand values without decimals", () => {
    expect(fmtUsdCompact(950.4)).toBe("$950");
  });

  it("formats zero", () => {
    expect(fmtUsdCompact(0)).toBe("$0");
  });
});

describe("fmtInt", () => {
  it("adds thousands separators", () => {
    expect(fmtInt(15803)).toBe("15,803");
  });
});

describe("fmtPercent", () => {
  it("renders two decimals with a percent sign", () => {
    expect(fmtPercent(8.4512)).toBe("8.45%");
  });
});
