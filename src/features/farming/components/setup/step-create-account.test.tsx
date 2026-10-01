import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { StepCreateAccount } from "./step-create-account";

// Deploy errors are surfaced through a sonner toast (a rejection carries a Retry
// action), not through inline DOM, so the toast is what has to be asserted.
jest.mock("sonner", () => ({ toast: { warning: jest.fn(), error: jest.fn() } }));

const mockHook = jest.fn();
jest.mock("@/features/account/hooks/use-onboarding-deploy", () => ({
  useOnboardingDeploy: (...args: unknown[]) => mockHook(...args),
}));

const mockAccept = jest.fn(async () => ({ optedIn: true }));
let mockOptedIn = true;
jest.mock("@/shared/hooks/use-beta-opt-in", () => ({
  useBetaOptInStatus: () => ({ data: { optedIn: mockOptedIn } }),
  useAcceptBetaTerms: () => ({ mutateAsync: mockAccept, isPending: false }),
}));

const idleState = {
  deploy: jest.fn(),
  retry: jest.fn(),
  isDeploying: false,
  deploySubStep: "idle" as const,
  deployCompleted: false,
  setupCompleted: false,
  deployError: null,
  deployErrorWasRejection: false,
  allDone: false,
};

beforeEach(() => {
  mockHook.mockReturnValue({ ...idleState });
  mockOptedIn = true;
  mockAccept.mockClear();
});

describe("StepCreateAccount", () => {
  it("renders title, one-transaction explainer, and Sign orb", () => {
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /create smart wallet/i })).toBeInTheDocument();
    expect(screen.getByText(/one transaction/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeInTheDocument();
  });

  it("calls deploy() when Sign orb clicked", async () => {
    const deploy = jest.fn();
    mockHook.mockReturnValue({ ...idleState, deploy });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /^create$/i }));
    expect(deploy).toHaveBeenCalled();
  });

  it("fires onComplete when allDone becomes true", () => {
    const onComplete = jest.fn();
    mockHook.mockReturnValue({
      ...idleState,
      deploySubStep: "done",
      deployCompleted: true,
      setupCompleted: true,
      allDone: true,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalled();
  });

  it("surfaces a rejection as a warning toast whose Retry action retries the deploy", () => {
    const retry = jest.fn();
    mockHook.mockReturnValue({
      ...idleState,
      retry,
      deployError: "Signing was cancelled in your wallet.",
      deployErrorWasRejection: true,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);

    expect(toast.warning).toHaveBeenCalledWith(
      "Signing was cancelled in your wallet.",
      expect.objectContaining({ action: expect.objectContaining({ label: "Retry" }) })
    );
    expect(toast.error).not.toHaveBeenCalled();

    // The Retry action must actually re-run the deploy, not just be labelled.
    const [, options] = (toast.warning as jest.Mock).mock.calls[0];
    options.action.onClick();
    expect(retry).toHaveBeenCalled();
  });

  it("surfaces a non-rejection failure as an error toast with no Retry action", () => {
    mockHook.mockReturnValue({
      ...idleState,
      deployError: "Transaction simulation failed.",
      deployErrorWasRejection: false,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);

    expect(toast.error).toHaveBeenCalledWith("Transaction simulation failed.");
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("renders back button when onBack provided", async () => {
    const onBack = jest.fn();
    render(
      <StepCreateAccount
        publicKey="GABC"
        preset="Balanced"
        onComplete={jest.fn()}
        onBack={onBack}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("requires the guarded-beta opt-in before a new wallet can create a vault", async () => {
    mockOptedIn = false;
    const deploy = jest.fn();
    mockHook.mockReturnValue({ ...idleState, deploy });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);

    const create = screen.getByRole("button", { name: /^create$/i });
    expect(create).toBeDisabled();
    expect(screen.getByText(/not yet externally audited/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(create).toBeEnabled();
    await userEvent.click(create);

    expect(mockAccept).toHaveBeenCalledTimes(1);
    expect(deploy).toHaveBeenCalledTimes(1);
  });

  it("skips the checkbox for a wallet that already opted in", () => {
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeEnabled();
  });
});
