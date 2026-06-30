/**
 * P2-5: BROWSE task type — icon/label regression tests.
 *
 * Backend emits taskType "BROWSE" for tasks like wallet_connect, sign_message,
 * vault_preview, and first_chat. Prior to this fix, getStepIcon and
 * getActionLabel inside QuestItem only checked `type === "visit"`, so the
 * checkId-specific labels (Connect Wallet, Sign and Verify, …) were never
 * reached — the button fell through to the default "Open Link" label.
 *
 * These tests render QuestItem directly with step.type = "browse" (the raw
 * backend value, bypassing mapTaskType) to confirm the functions handle it.
 * They were RED before the fix (button name was "Open Link") and GREEN after.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import type { CampaignStep } from "@/features/quest/types";
import { QuestItem } from "../CampaignDetail";

jest.mock("@/features/quest/context/wallet-context", () => ({
  useWallet: () => ({
    isConnected: true,
    isAuthenticated: true,
    address: "GABC...",
    connect: jest.fn(),
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  }),
}));

jest.mock("@/gen-quest/hooks", () => ({
  useTasksControllerGetStatus: () => ({ data: undefined, refetch: jest.fn() }),
  useTasksControllerGetClaimStatus: () => ({ data: undefined, refetch: jest.fn() }),
  useTasksControllerClaimTask: () => ({ mutate: jest.fn(), isPending: false }),
  useTasksControllerVerifyTask: () => ({ mutate: jest.fn(), isPending: false }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

/**
 * Build a CampaignStep with type "browse" — the raw value the backend sends.
 * The cast bypasses the CampaignStep union so we can exercise getStepIcon /
 * getActionLabel with the exact string before mapTaskType normalises it.
 */
const browseStep = (checkId: string): CampaignStep =>
  ({
    id: "task-browse",
    type: "browse",
    label: "Test Browse Task",
    actionUrl: "https://app.tasmil-finance.xyz",
    checkId,
  }) as unknown as CampaignStep;

describe("QuestItem — BROWSE taskType renders checkId-specific labels (P2-5)", () => {
  it("wallet_connect → 'Connect Wallet' (not the generic 'Open Link')", () => {
    render(<QuestItem step={browseStep("wallet_connect")} taskId="t1" isAuthenticated />);
    fireEvent.click(screen.getByText("Test Browse Task"));
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("sign_message → 'Sign and Verify'", () => {
    render(<QuestItem step={browseStep("sign_message")} taskId="t2" isAuthenticated />);
    fireEvent.click(screen.getByText("Test Browse Task"));
    expect(screen.getByRole("button", { name: /sign and verify/i })).toBeInTheDocument();
  });

  it("vault_preview → 'Explore Vault'", () => {
    render(<QuestItem step={browseStep("vault_preview")} taskId="t3" isAuthenticated />);
    fireEvent.click(screen.getByText("Test Browse Task"));
    expect(screen.getByRole("button", { name: /explore vault/i })).toBeInTheDocument();
  });

  it("first_chat → 'Chat with Agent'", () => {
    render(<QuestItem step={browseStep("first_chat")} taskId="t4" isAuthenticated />);
    fireEvent.click(screen.getByText("Test Browse Task"));
    expect(screen.getByRole("button", { name: /chat with agent/i })).toBeInTheDocument();
  });
});
