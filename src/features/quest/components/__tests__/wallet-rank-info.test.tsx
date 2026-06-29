import { render, screen } from "@testing-library/react";
import { WalletRankInfo } from "../WalletRankInfo";

jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetMe: () => ({ data: { tier: "COHORT_4", totalPoints: 150 } }),
  useSeasonsControllerMyResult: () => ({ data: { data: { finalRank: 34, percentile: 92 } } }),
}));

describe("WalletRankInfo", () => {
  it("renders rank, tier and points", () => {
    render(<WalletRankInfo />);
    expect(screen.getByTestId("wallet-rank-info")).toHaveTextContent("#34");
    expect(screen.getByTestId("wallet-rank-info")).toHaveTextContent(/bronze/i);
    expect(screen.getByTestId("wallet-rank-info")).toHaveTextContent("150");
  });
});
