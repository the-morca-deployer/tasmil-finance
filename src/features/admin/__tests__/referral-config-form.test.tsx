import { fireEvent, render, screen } from "@testing-library/react";
import ReferralConfigPage from "@/app/admin/(app)/referral-config/page";
import {
  useReferralConfig,
  useUpdateReferralConfig,
} from "@/features/admin/hooks/use-admin-referral-config";

jest.mock("@/features/admin/hooks/use-admin-referral-config", () => {
  const actual = jest.requireActual("@/features/admin/hooks/use-admin-referral-config");
  return {
    ...actual,
    useReferralConfig: jest.fn(),
    useUpdateReferralConfig: jest.fn(),
  };
});

const mockUseConfig = useReferralConfig as jest.Mock;
const mockUseUpdate = useUpdateReferralConfig as jest.Mock;

// Only NORMAL rows are configured; KOL/INFLUENCER cells are intentionally unset
// to exercise the "falls back to NORMAL" hint.
const config = [
  { layer: 1, segment: "NORMAL", rateBps: 1000, isActive: true },
  { layer: 2, segment: "NORMAL", rateBps: 300, isActive: true },
  { layer: 3, segment: "NORMAL", rateBps: 100, isActive: true },
];

describe("Admin referral-config matrix", () => {
  const mutate = jest.fn();

  beforeEach(() => {
    mutate.mockReset();
    mockUseConfig.mockReturnValue({ data: config, isLoading: false, error: null });
    mockUseUpdate.mockReturnValue({ mutate, isPending: false });
  });

  it("renders one editable rate per layer x segment cell (9 total)", () => {
    render(<ReferralConfigPage />);
    for (const layer of [1, 2, 3]) {
      for (const segment of ["NORMAL", "KOL", "INFLUENCER"]) {
        expect(
          screen.getByLabelText(new RegExp(`layer ${layer} ${segment} rate`, "i")),
        ).toBeInTheDocument();
      }
    }
  });

  it("shows the not-set hint for cells with no config row", () => {
    render(<ReferralConfigPage />);
    // 6 unset cells: layers 1-3 x KOL/INFLUENCER.
    expect(screen.getAllByText(/not set\. falls back to the normal rate/i)).toHaveLength(6);
  });

  it("submits an edited rate for the matching layer and segment", () => {
    render(<ReferralConfigPage />);
    const input = screen.getByLabelText(/layer 1 normal rate/i);
    fireEvent.change(input, { target: { value: "500" } });
    const saveButtons = screen.getAllByRole("button", { name: /save/i });
    fireEvent.click(saveButtons.at(0) as HTMLElement);
    expect(mutate).toHaveBeenCalledWith({
      layer: 1,
      segment: "NORMAL",
      rateBps: 500,
      isActive: true,
    });
  });
});
