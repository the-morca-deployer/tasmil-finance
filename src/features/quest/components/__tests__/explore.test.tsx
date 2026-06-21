import { render, screen } from "@testing-library/react";
import Explore from "../Explore";

jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindAll: () => ({ data: undefined, isLoading: true }),
}));

describe("Explore", () => {
  it("renders the hero CTA linking to /quest/campaigns", () => {
    render(<Explore />);
    const cta = screen.getByRole("link", { name: /start questing/i });
    expect(cta).toHaveAttribute("href", "/quest/campaigns");
  });
});
