import { tierFromVolume } from "./tier";

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
