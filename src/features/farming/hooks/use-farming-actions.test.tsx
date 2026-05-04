import { act, renderHook, waitFor } from "@testing-library/react";
import { useFarmingActions } from "./use-farming-actions";

const mocks = {
  fundMutate: jest.fn(),
  withdrawMutate: jest.fn(),
  revokeMutate: jest.fn(),
  reactivateMutate: jest.fn(),
  submitTxMutate: jest.fn(),
  updatePresetMutate: jest.fn(),
};

jest.mock("@/features/account/hooks/use-account-api", () => ({
  useFundAccount: () => ({ mutateAsync: mocks.fundMutate, isPending: false }),
  useWithdraw: () => ({ mutateAsync: mocks.withdrawMutate, isPending: false }),
  useRevoke: () => ({ mutateAsync: mocks.revokeMutate, isPending: false }),
  useReactivate: () => ({ mutateAsync: mocks.reactivateMutate, isPending: false }),
  useSubmitTx: () => ({ mutateAsync: mocks.submitTxMutate, isPending: false }),
  useUpdatePreset: () => ({ mutateAsync: mocks.updatePresetMutate, isPending: false }),
}));

jest.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: {
    signTransaction: jest.fn().mockResolvedValue({ signedTxXdr: "signed-xdr" }),
  },
}));

describe("useFarmingActions", () => {
  beforeEach(() => {
    for (const m of Object.values(mocks)) m.mockReset();
  });

  it("fund: builds, signs, submits", async () => {
    mocks.fundMutate.mockResolvedValue({ xdr: "fund-xdr" });
    mocks.submitTxMutate.mockResolvedValue({});
    const { result } = renderHook(() => useFarmingActions("GABC"));
    await act(async () => {
      await result.current.fund(100, "USDC");
    });
    expect(mocks.fundMutate).toHaveBeenCalledWith({
      publicKey: "GABC",
      amount: 100,
      token: "USDC",
    });
    expect(mocks.submitTxMutate).toHaveBeenCalledWith(
      expect.objectContaining({ signedXdr: "signed-xdr", txType: "fund" })
    );
    expect(result.current.actionError).toBeNull();
  });

  it("fund: sets actionError on failure", async () => {
    mocks.fundMutate.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useFarmingActions("GABC"));
    await act(async () => {
      await result.current.fund(100, "USDC");
    });
    await waitFor(() => expect(result.current.actionError).toBe("boom"));
  });

  it("withdraw: skips when publicKey missing", async () => {
    const { result } = renderHook(() => useFarmingActions(undefined));
    await act(async () => {
      await result.current.withdraw(50);
    });
    expect(mocks.withdrawMutate).not.toHaveBeenCalled();
  });

  it("withdraw: signs xdrs and signedXdrs paths; only last submit gets txType", async () => {
    mocks.withdrawMutate.mockResolvedValue({
      xdrs: ["xdr-a"],
      signedXdrs: ["pre-signed-b"],
    });
    mocks.submitTxMutate.mockResolvedValue({});
    const { result } = renderHook(() => useFarmingActions("GABC"));
    await act(async () => {
      await result.current.withdraw(50);
    });
    expect(mocks.submitTxMutate).toHaveBeenCalledTimes(2);
    // First submit (client-signed xdr): no txType because signedXdrs follows
    expect(mocks.submitTxMutate).toHaveBeenNthCalledWith(1, { signedXdr: "signed-xdr" });
    // Last submit (pre-signed): tagged with txType
    expect(mocks.submitTxMutate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ signedXdr: "pre-signed-b", txType: "withdraw", amount: 50 })
    );
  });

  it("revoke: signs and submits with txType=revoke", async () => {
    mocks.revokeMutate.mockResolvedValue({ xdr: "rev-xdr" });
    mocks.submitTxMutate.mockResolvedValue({});
    const { result } = renderHook(() => useFarmingActions("GABC"));
    await act(async () => {
      await result.current.revoke();
    });
    expect(mocks.revokeMutate).toHaveBeenCalledWith("GABC");
    expect(mocks.submitTxMutate).toHaveBeenCalledWith({
      signedXdr: "signed-xdr",
      publicKey: "GABC",
      txType: "revoke",
    });
  });

  it("reactivate: signs each setupTx; only last submit gets txType", async () => {
    mocks.reactivateMutate.mockResolvedValue({ setupTxs: ["s1", "s2"] });
    mocks.submitTxMutate.mockResolvedValue({});
    const { result } = renderHook(() => useFarmingActions("GABC"));
    await act(async () => {
      await result.current.reactivate();
    });
    expect(mocks.submitTxMutate).toHaveBeenCalledTimes(2);
    expect(mocks.submitTxMutate).toHaveBeenNthCalledWith(1, { signedXdr: "signed-xdr" });
    expect(mocks.submitTxMutate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ signedXdr: "signed-xdr", txType: "reactivate" })
    );
  });

  it("applyPreset: calls updatePreset.mutateAsync without signing XDR", async () => {
    mocks.updatePresetMutate.mockResolvedValue({});
    const { result } = renderHook(() => useFarmingActions("GABC"));
    await act(async () => {
      await result.current.applyPreset("Aggressive");
    });
    expect(mocks.updatePresetMutate).toHaveBeenCalledWith({
      publicKey: "GABC",
      preset: "Aggressive",
    });
    // No signing path
    expect(mocks.submitTxMutate).not.toHaveBeenCalled();
  });

  it("fund: skips when publicKey missing", async () => {
    const { result } = renderHook(() => useFarmingActions(undefined));
    await act(async () => {
      await result.current.fund(100, "USDC");
    });
    expect(mocks.fundMutate).not.toHaveBeenCalled();
  });
});
