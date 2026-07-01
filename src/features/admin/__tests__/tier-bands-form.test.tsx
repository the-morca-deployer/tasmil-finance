import { fireEvent, render, screen } from "@testing-library/react";
import TierBandsPage from "@/app/admin/(app)/tier-bands/page";
import { useTierBands, useUpdateTierBand } from "@/features/admin/hooks/use-admin-tier-bands";

jest.mock("@/features/admin/hooks/use-admin-tier-bands", () => ({
  useTierBands: jest.fn(),
  useUpdateTierBand: jest.fn(),
}));

const mockUseBands = useTierBands as jest.Mock;
const mockUseUpdate = useUpdateTierBand as jest.Mock;

const bands = [
  { tier: "Bronze", min: 500 },
  { tier: "Silver", min: 1500 },
  { tier: "Gold", min: 3500 },
];

describe("Admin tier-bands form", () => {
  const mutate = jest.fn();

  beforeEach(() => {
    mutate.mockReset();
    mockUseBands.mockReturnValue({ data: bands, isLoading: false, error: null });
    mockUseUpdate.mockReturnValue({ mutate, isPending: false });
  });

  it("renders one editable threshold per tier, ordered ascending", () => {
    render(<TierBandsPage />);
    const inputs = screen.getAllByLabelText(/points to reach/i);
    expect(inputs.map((el) => el.getAttribute("id"))).toEqual([
      "tier-Bronze-min",
      "tier-Silver-min",
      "tier-Gold-min",
    ]);
  });

  it("submits an edited threshold for the matching tier", () => {
    render(<TierBandsPage />);
    const input = screen.getByLabelText(/points to reach silver/i);
    fireEvent.change(input, { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: /save silver/i }));
    expect(mutate).toHaveBeenCalledWith({ tier: "Silver", min: 2000 });
  });
});
