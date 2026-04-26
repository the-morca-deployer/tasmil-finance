import { buildAiIdentityHeaders } from "./ai-auth";

describe("buildAiIdentityHeaders", () => {
  it("returns the wallet header when only a wallet address exists", () => {
    expect(
      buildAiIdentityHeaders({
        walletAddress: "GABC123",
      })
    ).toEqual({
      "X-Chat-Wallet-Address": "GABC123",
    });
  });

  it("merges JWT and wallet headers when both exist", () => {
    expect(
      buildAiIdentityHeaders({
        accessToken: "jwt-token-123",
        walletAddress: "GABC123",
      })
    ).toEqual({
      Authorization: "Bearer jwt-token-123",
      "X-Chat-Wallet-Address": "GABC123",
    });
  });
});
