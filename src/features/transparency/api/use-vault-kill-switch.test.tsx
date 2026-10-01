import { act, renderHook, waitFor } from "@testing-library/react";
import { useVaultKillSwitch } from "./use-vault-kill-switch";

const mocks = {
  buildMutate: jest.fn(),
  submitMutate: jest.fn(),
  signTransaction: jest.fn(),
};

jest.mock("@/shared/hooks/use-account-mutations", () => ({
  useBuildKillSwitch: () => ({ mutateAsync: mocks.buildMutate, isPending: false }),
  useSubmitTx: () => ({ mutateAsync: mocks.submitMutate, isPending: false }),
}));

jest.mock("@/shared/config/stellar", () => ({
  activeNetwork: { networkPassphrase: "Test SDF Network ; September 2015" },
}));

jest.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: {
    signTransaction: (...args: unknown[]) => mocks.signTransaction(...args),
  },
}));

describe("useVaultKillSwitch", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  it("builds, signs, submits, and refreshes confirmed state", async () => {
    const onConfirmed = jest.fn();
    mocks.buildMutate.mockResolvedValue({ xdr: "unsigned-xdr" });
    mocks.signTransaction.mockResolvedValue({ signedTxXdr: "signed-xdr" });
    mocks.submitMutate.mockResolvedValue({});
    const { result } = renderHook(() => useVaultKillSwitch("GOWNER", onConfirmed));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.setEnabled(true);
    });

    expect(succeeded).toBe(true);
    expect(mocks.buildMutate).toHaveBeenCalledWith({ publicKey: "GOWNER", enabled: true });
    expect(mocks.signTransaction).toHaveBeenCalledWith("unsigned-xdr", {
      address: "GOWNER",
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    expect(mocks.submitMutate).toHaveBeenCalledWith({
      signedXdr: "signed-xdr",
      publicKey: "GOWNER",
    });
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it("surfaces a build or signing error without refreshing", async () => {
    const onConfirmed = jest.fn();
    mocks.buildMutate.mockRejectedValue(new Error("Wallet rejected"));
    const { result } = renderHook(() => useVaultKillSwitch("GOWNER", onConfirmed));

    await act(async () => {
      await result.current.setEnabled(false);
    });

    await waitFor(() => expect(result.current.error).toBe("Wallet rejected"));
    expect(mocks.submitMutate).not.toHaveBeenCalled();
    expect(onConfirmed).not.toHaveBeenCalled();
  });
});
