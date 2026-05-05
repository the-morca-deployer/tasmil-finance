import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepConnect } from "./step-connect";

const connect = jest.fn();
const mockUseWallet = jest.fn();
jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => mockUseWallet(),
}));

beforeEach(() => {
  connect.mockClear();
  mockUseWallet.mockReturnValue({ isConnected: false, connect });
});

describe("StepConnect", () => {
  it("renders title and outline Connect Wallet button", () => {
    render(<StepConnect onConnected={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("calls connect() on click", async () => {
    render(<StepConnect onConnected={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(connect).toHaveBeenCalled();
  });

  it("auto-fires onConnected when isConnected becomes true", async () => {
    const onConnected = jest.fn();
    const { rerender } = render(<StepConnect onConnected={onConnected} />);
    expect(onConnected).not.toHaveBeenCalled();
    mockUseWallet.mockReturnValue({ isConnected: true, connect });
    rerender(<StepConnect onConnected={onConnected} />);
    expect(onConnected).toHaveBeenCalled();
  });
});
