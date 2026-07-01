import { RANK_ORDER, rankFromPoints } from "./tier";

describe("RANK_ORDER", () => {
  it("is eight ranks, low → high", () => {
    expect(RANK_ORDER).toEqual([
      "Unranked",
      "Bronze",
      "Silver",
      "Gold",
      "Platinum",
      "Emerald",
      "Diamond",
      "Master",
    ]);
  });
});

describe("rankFromPoints (8-rank points ladder)", () => {
  it("Unranked below 500", () => {
    expect(rankFromPoints(0).rank).toBe("Unranked");
    expect(rankFromPoints(499).rank).toBe("Unranked");
    expect(rankFromPoints(499).nextRank).toBe("Bronze");
    expect(rankFromPoints(499).toNext).toBe(1); // 500 - 499
  });
  it("Bronze in [500, 1500)", () => {
    expect(rankFromPoints(500).rank).toBe("Bronze");
    expect(rankFromPoints(1499).rank).toBe("Bronze");
    expect(rankFromPoints(500).nextRank).toBe("Silver");
    expect(rankFromPoints(500).toNext).toBe(1000); // 1500 - 500
  });
  it("Silver in [1500, 3500)", () => {
    expect(rankFromPoints(1500).rank).toBe("Silver");
    expect(rankFromPoints(3499).rank).toBe("Silver");
    expect(rankFromPoints(1500).nextRank).toBe("Gold");
  });
  it("Gold in [3500, 7500)", () => {
    expect(rankFromPoints(3500).rank).toBe("Gold");
    expect(rankFromPoints(7499).rank).toBe("Gold");
    expect(rankFromPoints(3500).nextRank).toBe("Platinum");
  });
  it("Platinum in [7500, 15000)", () => {
    expect(rankFromPoints(7500).rank).toBe("Platinum");
    expect(rankFromPoints(14999).rank).toBe("Platinum");
    expect(rankFromPoints(7500).nextRank).toBe("Emerald");
  });
  it("Emerald in [15000, 30000)", () => {
    expect(rankFromPoints(15000).rank).toBe("Emerald");
    expect(rankFromPoints(29999).rank).toBe("Emerald");
    expect(rankFromPoints(15000).nextRank).toBe("Diamond");
  });
  it("Diamond in [30000, 50000)", () => {
    expect(rankFromPoints(30000).rank).toBe("Diamond");
    expect(rankFromPoints(49999).rank).toBe("Diamond");
    expect(rankFromPoints(30000).nextRank).toBe("Master");
  });
  it("Master at 50000 and above", () => {
    expect(rankFromPoints(50000).rank).toBe("Master");
    expect(rankFromPoints(1_000_000).rank).toBe("Master");
    expect(rankFromPoints(50000).nextRank).toBeNull();
    expect(rankFromPoints(50000).toNext).toBe(0);
    expect(rankFromPoints(50000).progress).toBe(1);
  });
  it("progress is fractional within a band", () => {
    // Bronze band [500, 1500): 1000 -> 0.5
    expect(rankFromPoints(1000).progress).toBeCloseTo(0.5, 5);
  });
  it("clamps negative / non-finite to Unranked", () => {
    expect(rankFromPoints(-50).rank).toBe("Unranked");
    expect(rankFromPoints(Number.NaN).rank).toBe("Unranked");
  });
});
