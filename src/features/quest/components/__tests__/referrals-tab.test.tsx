import { fireEvent, render, screen } from "@testing-library/react";
import type { ReferralTree } from "../../lib/season-types";
import { Referrals } from "../Referrals";

const mockUseTree = jest.fn();
jest.mock("@/gen-quest", () => ({
  useReferralControllerGetTree: () => mockUseTree(),
}));

const tree: ReferralTree = {
  rates: [
    { layer: 1, rateBps: 1000 },
    { layer: 2, rateBps: 300 },
    { layer: 3, rateBps: 100 },
  ],
  totalCommissionPoints: 1250,
  tree: [
    {
      userId: "a",
      name: "trader_mike",
      layer: 1,
      q: 2400,
      e: 240,
      status: "active",
      children: [
        {
          userId: "b",
          name: "stargazer99",
          layer: 2,
          q: 800,
          e: 24,
          status: "active",
          children: [],
        },
      ],
    },
  ],
};

describe("Referrals tab", () => {
  beforeEach(() => mockUseTree.mockReset());

  it("renders the list view with referees and their points", () => {
    mockUseTree.mockReturnValue({ data: { data: tree }, isLoading: false });
    render(<Referrals />);
    expect(screen.getByText("trader_mike")).toBeInTheDocument();
    expect(screen.getByText("stargazer99")).toBeInTheDocument();
    // PTS earned + quest pts formatted
    expect(screen.getByText("1,250")).toBeInTheDocument();
  });

  it("renders the three commission-rate cards (10% / 3% / 1%)", () => {
    mockUseTree.mockReturnValue({ data: { data: tree }, isLoading: false });
    render(<Referrals />);
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("3%")).toBeInTheDocument();
    expect(screen.getByText("1%")).toBeInTheDocument();
  });

  it("switches to the tree view and shows a layer badge", () => {
    mockUseTree.mockReturnValue({ data: { data: tree }, isLoading: false });
    render(<Referrals />);
    fireEvent.click(screen.getByRole("button", { name: /referral tree/i }));
    expect(screen.getByText("L1")).toBeInTheDocument();
  });
});
