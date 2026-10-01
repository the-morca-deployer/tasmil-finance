import { normalizePortfolioHistoryPayload } from "./use-portfolio-history";

const snapshot = {
  timestamp: "2026-10-01T17:55:30.014Z",
  totalValueUsd: 2.19,
  walletUsd: 0,
  defiUsd: 2.19,
  totalValueAsset: 10,
  walletAsset: 0,
  defiAsset: 10,
  assetSymbol: "XLM",
  assetPriceUsd: 0.219,
};

describe("normalizePortfolioHistoryPayload", () => {
  it("accepts the direct array returned by the Next.js history route", () => {
    expect(normalizePortfolioHistoryPayload([snapshot])).toHaveLength(1);
  });

  it("also accepts the backend success envelope", () => {
    expect(normalizePortfolioHistoryPayload({ success: true, data: [snapshot] })).toHaveLength(1);
  });
});
