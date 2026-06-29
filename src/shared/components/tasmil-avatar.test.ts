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
  it("is the exact brand palette", () => {
    expect(TASMIL_AVATAR_COLORS).toEqual(["#67e8f9", "#0ea5e9", "#0369a1", "#04141a", "#d9fbff"]);
  });
});
