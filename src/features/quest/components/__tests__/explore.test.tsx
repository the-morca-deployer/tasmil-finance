import { render, screen } from "@testing-library/react";
import Explore from "../Explore";

jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindAll: () => ({ data: undefined, isLoading: true }),
  // Explore also calls useFomoControllerGetActive (added after this mock was
  // written). It reads `const { data: fomoData } = ...`, so undefined is safe.
  useFomoControllerGetActive: () => ({ data: undefined }),
}));
// FomoBanner (a child of Explore) imports useFomoControllerGetActive from the
// "@/gen-quest" barrel. That barrel re-exports from the individual
// "@/gen-quest/hooks/use-*" modules, NOT from "@/gen-quest/hooks", so the mock
// above does not reach it. Stub the banner out - the unit under test is
// Explore's own hero CTA.
jest.mock("@/features/quest/components/FomoBanner", () => ({
  __esModule: true,
  default: () => null,
}));

describe("Explore", () => {
  it("renders the hero CTA linking to /quest/campaigns", () => {
    render(<Explore />);
    const cta = screen.getByRole("link", { name: /start questing/i });
    expect(cta).toHaveAttribute("href", "/quest/campaigns");
  });
});
