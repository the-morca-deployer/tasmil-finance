import { fireEvent, render, screen } from "@testing-library/react";
import { FarmingVaultHeader } from "./farming-vault-header";

const baseProps = {
  totalValueUsd: 2.19,
  totalValueAsset: 10,
  displayAsset: "XLM",
  assetPriceUsd: 0.219,
  allTimePnlUsd: -0.22,
  allTimePnlAsset: 0.004,
  allTimePnlPercent: -9.94,
  allTimePnlPercentAsset: 0.04,
  currentApy: 0.061,
  status: "ACTIVE" as const,
  onDeposit: jest.fn(),
  onWithdraw: jest.fn(),
  onSecurity: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FarmingVaultHeader", () => {
  it("shows the vault asset as primary value and USD only as an approximation", () => {
    render(<FarmingVaultHeader {...baseProps} />);

    expect(screen.getByText("10.00 XLM")).toBeInTheDocument();
    expect(screen.getByText("≈ $2.19")).toBeInTheDocument();
    expect(screen.getByText(/XLM portfolio value/i)).toBeInTheDocument();
    expect(screen.getByText(/\+0\.004 XLM/)).toBeInTheDocument();
    expect(screen.getByText(/\+0\.04%/)).toBeInTheDocument();
    expect(screen.getByText("6.10% APY")).toBeInTheDocument();
  });

  it("delegates its actions through callbacks", () => {
    render(<FarmingVaultHeader {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Deposit" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    expect(baseProps.onDeposit).toHaveBeenCalledTimes(1);
    expect(baseProps.onWithdraw).toHaveBeenCalledTimes(1);
    expect(baseProps.onSecurity).toHaveBeenCalledTimes(1);
  });

  it("anchors the action group to the right on desktop", () => {
    render(<FarmingVaultHeader {...baseProps} />);

    expect(screen.getByTestId("vault-header-actions")).toHaveClass("lg:justify-self-end");
  });

  it("offers activation for a revoked vault", () => {
    render(<FarmingVaultHeader {...baseProps} status="REVOKED" />);

    expect(screen.getByText("Paused")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Activate Session Key" }));
    expect(baseProps.onSecurity).toHaveBeenCalledTimes(1);
  });
});
