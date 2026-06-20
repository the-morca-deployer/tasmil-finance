import { fireEvent, render, screen } from "@testing-library/react";
import ReferralConfigPage from "@/app/admin/(app)/referral-config/page";
import {
  useReferralConfig,
  useUpdateReferralConfig,
} from "@/features/admin/hooks/use-admin-referral-config";

jest.mock("@/features/admin/hooks/use-admin-referral-config", () => ({
  useReferralConfig: jest.fn(),
  useUpdateReferralConfig: jest.fn(),
}));

const mockUseConfig = useReferralConfig as jest.Mock;
const mockUseUpdate = useUpdateReferralConfig as jest.Mock;

const config = [
  { layer: 1, rateBps: 1000, isActive: true },
  { layer: 2, rateBps: 300, isActive: true },
  { layer: 3, rateBps: 100, isActive: true },
];

describe("Admin referral-config form", () => {
  const mutate = jest.fn();

  beforeEach(() => {
    mutate.mockReset();
    mockUseConfig.mockReturnValue({ data: config, isLoading: false, error: null });
    mockUseUpdate.mockReturnValue({ mutate, isPending: false });
  });

  it("renders one editable rate per layer", () => {
    render(<ReferralConfigPage />);
    expect(screen.getByLabelText(/layer 1 rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/layer 2 rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/layer 3 rate/i)).toBeInTheDocument();
  });

  it("submits an edited rate for the matching layer", () => {
    render(<ReferralConfigPage />);
    const input = screen.getByLabelText(/layer 1 rate/i);
    fireEvent.change(input, { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /save layer 1/i }));
    expect(mutate).toHaveBeenCalledWith({ layer: 1, rateBps: 500, isActive: true });
  });
});
