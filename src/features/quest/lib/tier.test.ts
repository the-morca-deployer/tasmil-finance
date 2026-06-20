import { tierDisplay, tierFromVolume } from "./tier";

describe("tierFromVolume", () => {
  it("returns bronze under $100", () => {
    expect(tierFromVolume(0)).toBe("bronze");
    expect(tierFromVolume(99)).toBe("bronze");
  });

  it("returns silver in [100, 500)", () => {
    expect(tierFromVolume(100)).toBe("silver");
    expect(tierFromVolume(499)).toBe("silver");
  });

  it("returns gold in [500, 2000)", () => {
    expect(tierFromVolume(500)).toBe("gold");
    expect(tierFromVolume(1999)).toBe("gold");
  });

  it("returns platinum in [2000, 10000)", () => {
    expect(tierFromVolume(2000)).toBe("platinum");
    expect(tierFromVolume(9999)).toBe("platinum");
  });

  it("returns diamond at 10000+", () => {
    expect(tierFromVolume(10_000)).toBe("diamond");
    expect(tierFromVolume(1_000_000)).toBe("diamond");
  });
});

describe("tierDisplay", () => {
  it("Bronze below 500 (boundary 499)", () => {
    expect(tierDisplay(0).tier).toBe("Bronze");
    expect(tierDisplay(499).tier).toBe("Bronze");
    expect(tierDisplay(499).nextTier).toBe("Silver");
    expect(tierDisplay(499).toNext).toBe(1); // 500 - 499
  });
  it("Silver at 500 and 2499", () => {
    expect(tierDisplay(500).tier).toBe("Silver");
    expect(tierDisplay(2499).tier).toBe("Silver");
    expect(tierDisplay(500).nextTier).toBe("Gold");
    expect(tierDisplay(500).toNext).toBe(2000); // 2500 - 500
  });
  it("Gold at 2500 and 4999", () => {
    expect(tierDisplay(2500).tier).toBe("Gold");
    expect(tierDisplay(4999).tier).toBe("Gold");
    expect(tierDisplay(2500).nextTier).toBe("Diamond");
    expect(tierDisplay(2500).toNext).toBe(2500); // 5000 - 2500
  });
  it("Diamond at 5000 and above", () => {
    expect(tierDisplay(5000).tier).toBe("Diamond");
    expect(tierDisplay(50000).tier).toBe("Diamond");
    expect(tierDisplay(5000).nextTier).toBeNull();
    expect(tierDisplay(5000).toNext).toBe(0);
    expect(tierDisplay(5000).progress).toBe(1);
  });
  it("progress is fractional within a band", () => {
    // Bronze band [0,500): 250 -> 0.5
    expect(tierDisplay(250).progress).toBeCloseTo(0.5, 5);
  });
});
