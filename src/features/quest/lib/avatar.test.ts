import { QUEST_AVATAR_VARIANTS, variantFromAvatarUrl, variantToken } from "./avatar";

describe("variantToken", () => {
  it("formats the token", () => {
    expect(variantToken("bauhaus")).toBe("tasmil:bauhaus");
  });
});

describe("variantFromAvatarUrl", () => {
  it("parses a valid token", () => {
    expect(variantFromAvatarUrl("tasmil:pixel")).toBe("pixel");
  });
  it("falls back to marble for empty/null", () => {
    expect(variantFromAvatarUrl(null)).toBe("marble");
    expect(variantFromAvatarUrl(undefined)).toBe("marble");
    expect(variantFromAvatarUrl("")).toBe("marble");
  });
  it("falls back for legacy dicebear", () => {
    expect(variantFromAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=quest3")).toBe(
      "marble"
    );
  });
  it("falls back for unknown token", () => {
    expect(variantFromAvatarUrl("tasmil:notreal")).toBe("marble");
  });
});

describe("QUEST_AVATAR_VARIANTS", () => {
  it("lists six variants in order", () => {
    expect(QUEST_AVATAR_VARIANTS).toEqual(["marble", "bauhaus", "beam", "pixel", "ring", "sunset"]);
  });
});
