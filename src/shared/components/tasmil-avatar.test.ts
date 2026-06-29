import { normalizeSeed, TASMIL_AVATAR_COLORS } from "./tasmil-avatar";

describe("normalizeSeed", () => {
  it("lowercases and trims", () => {
    expect(normalizeSeed("  GDQI...3I6R  ")).toBe("gdqi...3i6r");
  });
  it("falls back to 'default'", () => {
    expect(normalizeSeed(null)).toBe("default");
    expect(normalizeSeed(undefined)).toBe("default");
    expect(normalizeSeed("   ")).toBe("default");
  });
  it("is deterministic", () => {
    expect(normalizeSeed("Alice")).toBe(normalizeSeed("alice"));
  });
});
describe("TASMIL_AVATAR_COLORS", () => {
  it("is the diverse per-wallet palette", () => {
    expect(TASMIL_AVATAR_COLORS).toEqual(["#22d3ee", "#6366f1", "#a855f7", "#ec4899", "#f59e0b"]);
  });
  it("has five distinct hues for seed variety", () => {
    expect(new Set(TASMIL_AVATAR_COLORS).size).toBe(5);
  });
});
