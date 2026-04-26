import { classifyChatProductError } from "./chat-product-error";

describe("classifyChatProductError", () => {
  it("maps AI auth rejections to SESSION_INVALID", () => {
    expect(
      classifyChatProductError({
        response: { status: 403, data: { detail: "SESSION_INVALID" } },
      })
    ).toBe("SESSION_INVALID");
  });

  it("maps invalid wallet claims to INVALID_CHAT_WALLET_ADDRESS", () => {
    expect(
      classifyChatProductError({
        response: { status: 400, data: { detail: "INVALID_CHAT_WALLET_ADDRESS" } },
      })
    ).toBe("INVALID_CHAT_WALLET_ADDRESS");
  });

  it("maps backend chat identity failures to CHAT_IDENTITY_RESOLUTION_FAILED", () => {
    expect(
      classifyChatProductError({
        response: { status: 503, data: { detail: "CHAT_IDENTITY_RESOLUTION_FAILED" } },
      })
    ).toBe("CHAT_IDENTITY_RESOLUTION_FAILED");
  });

  it("maps quota rejections to CHAT_USAGE_LIMIT_REACHED", () => {
    expect(
      classifyChatProductError({
        response: { status: 429, data: { detail: "CHAT_USAGE_LIMIT_REACHED" } },
      })
    ).toBe("CHAT_USAGE_LIMIT_REACHED");
  });

  it("falls back to GENERIC_AI_ERROR for unknown errors", () => {
    expect(classifyChatProductError(new Error("boom"))).toBe("GENERIC_AI_ERROR");
  });
});
