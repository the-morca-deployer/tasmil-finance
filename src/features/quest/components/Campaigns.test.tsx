import { render, screen } from "@testing-library/react";
import Campaigns from "./Campaigns";

const items = [
  {
    id: "a",
    title: "Alpha Quest",
    description: "d",
    rewardPoints: 100,
    questersCount: 5,
    status: "ongoing",
  },
  {
    id: "b",
    title: "Beta Quest",
    description: "d",
    rewardPoints: 200,
    questersCount: 9,
    status: "ongoing",
  },
];

const mockUseFindAll = jest.fn();
jest.mock("@/gen-quest", () => ({
  useCampaignsControllerFindAll: (...a: unknown[]) => mockUseFindAll(...a),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe("Campaigns grid", () => {
  it("shows loader while loading", () => {
    mockUseFindAll.mockReturnValue({ data: undefined, isLoading: true });
    render(<Campaigns />);
    expect(screen.getByTestId("quest-loader")).toBeInTheDocument();
  });
  it("renders one card per campaign", () => {
    mockUseFindAll.mockReturnValue({
      data: { success: true, data: { items, meta: { total: 2 } }, error: null },
      isLoading: false,
    });
    const { container } = render(<Campaigns />);
    expect(container.querySelectorAll(".camp-card")).toHaveLength(2);
    expect(screen.getByText("Alpha Quest")).toBeInTheDocument();
  });
});
