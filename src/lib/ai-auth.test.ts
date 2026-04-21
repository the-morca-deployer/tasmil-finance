import { buildAiAuthHeaders } from "./ai-auth";

describe("buildAiAuthHeaders", () => {
  it("returns Authorization when a backend JWT exists", () => {
    expect(buildAiAuthHeaders("jwt-token-123")).toEqual({
      Authorization: "Bearer jwt-token-123",
    });
  });

  it("returns an empty object when there is no backend JWT", () => {
    expect(buildAiAuthHeaders(null)).toEqual({});
    expect(buildAiAuthHeaders(undefined)).toEqual({});
  });
});
