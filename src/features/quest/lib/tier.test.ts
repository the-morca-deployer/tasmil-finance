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
  it("Unranked below 100", () => {
    expect(rankFromPoints(0).rank).toBe("Unranked");
    expect(rankFromPoints(99).rank).toBe("Unranked");
    expect(rankFromPoints(99).nextRank).toBe("Bronze");
    expect(rankFromPoints(99).toNext).toBe(1); // 100 - 99
  });
  it("Bronze in [100, 300)", () => {
    expect(rankFromPoints(100).rank).toBe("Bronze");
    expect(rankFromPoints(299).rank).toBe("Bronze");
    expect(rankFromPoints(100).nextRank).toBe("Silver");
    expect(rankFromPoints(100).toNext).toBe(200); // 300 - 100
  });
  it("Silver in [300, 700)", () => {
    expect(rankFromPoints(300).rank).toBe("Silver");
    expect(rankFromPoints(699).rank).toBe("Silver");
    expect(rankFromPoints(300).nextRank).toBe("Gold");
  });
  it("Gold in [700, 1500)", () => {
    expect(rankFromPoints(700).rank).toBe("Gold");
    expect(rankFromPoints(1499).rank).toBe("Gold");
    expect(rankFromPoints(700).nextRank).toBe("Platinum");
  });
  it("Platinum in [1500, 3000)", () => {
    expect(rankFromPoints(1500).rank).toBe("Platinum");
    expect(rankFromPoints(2999).rank).toBe("Platinum");
    expect(rankFromPoints(1500).nextRank).toBe("Emerald");
  });
  it("Emerald in [3000, 6000)", () => {
    expect(rankFromPoints(3000).rank).toBe("Emerald");
    expect(rankFromPoints(5999).rank).toBe("Emerald");
    expect(rankFromPoints(3000).nextRank).toBe("Diamond");
  });
  it("Diamond in [6000, 10000)", () => {
    expect(rankFromPoints(6000).rank).toBe("Diamond");
    expect(rankFromPoints(9999).rank).toBe("Diamond");
    expect(rankFromPoints(6000).nextRank).toBe("Master");
  });
  it("Master at 10000 and above", () => {
    expect(rankFromPoints(10000).rank).toBe("Master");
    expect(rankFromPoints(1_000_000).rank).toBe("Master");
    expect(rankFromPoints(10000).nextRank).toBeNull();
    expect(rankFromPoints(10000).toNext).toBe(0);
    expect(rankFromPoints(10000).progress).toBe(1);
  });
  it("progress is fractional within a band", () => {
    // Bronze band [100, 300): 200 -> 0.5
    expect(rankFromPoints(200).progress).toBeCloseTo(0.5, 5);
  });
  it("clamps negative / non-finite to Unranked", () => {
    expect(rankFromPoints(-50).rank).toBe("Unranked");
    expect(rankFromPoints(Number.NaN).rank).toBe("Unranked");
  });
});
