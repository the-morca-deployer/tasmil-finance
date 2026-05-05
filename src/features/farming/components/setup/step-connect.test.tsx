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
  it("renders Get started title and Connect Wallet orb button when disconnected", () => {
    render(<StepConnect onConnected={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("calls connect() when disconnected and orb clicked", async () => {
    render(<StepConnect onConnected={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(connect).toHaveBeenCalled();
  });

  it("orb shows Continue and calls onConnected() when connected", async () => {
    const onConnected = jest.fn();
    mockUseWallet.mockReturnValue({ isConnected: true, connect });
    render(<StepConnect onConnected={onConnected} />);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onConnected).toHaveBeenCalled();
  });

  it("renders bottom corner copy", () => {
    render(<StepConnect onConnected={jest.fn()} />);
    expect(screen.getByText(/your portfolio keeps/i)).toBeInTheDocument();
    expect(screen.getByText(/© 2026 Tasmil/i)).toBeInTheDocument();
  });
});
