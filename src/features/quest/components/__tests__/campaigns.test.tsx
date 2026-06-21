import { render, screen } from "@testing-library/react";
import Campaigns from "../Campaigns";

jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindAll: () => ({
    data: {
      data: {
        items: [
          {
            id: "c1",
            title: "Index Builder",
            isActive: true,
            endAt: "2030-01-01T00:00:00Z",
            rewardPoints: 450,
          },
        ],
      },
    },
    isLoading: false,
  }),
}));

describe("Campaigns", () => {
  it("renders the Ongoing/Closed filter tabs", () => {
    render(<Campaigns />);
    expect(screen.getByRole("tab", { name: /ongoing/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /closed/i })).toBeInTheDocument();
  });
});
