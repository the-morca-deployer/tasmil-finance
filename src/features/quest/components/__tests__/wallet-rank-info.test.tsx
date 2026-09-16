import { render, screen } from "@testing-library/react";
import { WalletRankInfo } from "../WalletRankInfo";

// The backend `tier` field is deliberately NOT used for display - every quest
// surface derives the rank band from `totalPoints` via lib/tier.ts. 750 points
// sits inside the Bronze band [500, 1500), so a profile whose backend cohort
// says COHORT_4 must still render as Bronze.
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetMe: () => ({ data: { tier: "COHORT_4", totalPoints: 750 } }),
  useSeasonsControllerMyResult: () => ({ data: { data: { finalRank: 34, percentile: 92 } } }),
}));

describe("WalletRankInfo", () => {
  it("renders season rank, the points-derived tier and the point total", () => {
    render(<WalletRankInfo />);
    const info = screen.getByTestId("wallet-rank-info");
    expect(info).toHaveTextContent("#34");
    expect(info).toHaveTextContent("top 92%");
    expect(info).toHaveTextContent(/bronze/i);
    expect(info).toHaveTextContent("750");
    // The raw backend cohort must never leak into the UI.
    expect(info).not.toHaveTextContent(/cohort/i);
  });
});
