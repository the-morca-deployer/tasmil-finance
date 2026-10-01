import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useStellarBalances } from "../hooks/use-stellar-balance";
import { FundForm } from "./fund-form";

jest.mock("../hooks/use-stellar-balance");
jest.mock("@/store/use-wallet", () => ({
  useWalletStore: () => ({ account: "GTEST" }),
}));

describe("FundForm", () => {
  beforeEach(() => {
    (useStellarBalances as jest.Mock).mockReturnValue({
      data: { usdc: 100, xlm: 20 },
      isLoading: false,
    });
  });

  it("shows XLM principal and source-wallet reserve separately", async () => {
    render(<FundForm onFund={jest.fn()} isLoading={false} />);

    await userEvent.click(screen.getByRole("button", { name: /XLM/i }));
    await userEvent.type(screen.getByRole("textbox"), "10");

    expect(screen.getByText(/investment amount/i)).toBeInTheDocument();
    expect(screen.getByText("10 XLM")).toBeInTheDocument();
    expect(screen.getByText(/recommended wallet reserve/i)).toBeInTheDocument();
    expect(screen.getByText("2 XLM")).toBeInTheDocument();
    expect(screen.getByText(/at least 12 XLM.*network fee/i)).toBeInTheDocument();
    expect(screen.getByText(/freighter.*exact network fee/i)).toBeInTheDocument();
  });
});
