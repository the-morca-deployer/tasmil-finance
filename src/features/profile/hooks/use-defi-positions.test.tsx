import { renderHook } from "@testing-library/react";
import { useBlendPositions } from "./use-blend-positions";
import { useDefiPositions } from "./use-defi-positions";

jest.mock("@/features/account/hooks/use-account-api", () => ({
  usePosition: () => ({ data: null, isLoading: false }),
}));
jest.mock("./use-blend-positions", () => ({ useBlendPositions: jest.fn() }));
jest.mock("./use-aquarius-positions", () => ({
  useAquariusPositions: () => ({ data: [], isLoading: false, isError: false }),
}));
jest.mock("./use-wallet-tokens", () => ({
  getCachedPrices: () => ({}),
  useWalletTokens: () => ({ data: { tokens: [] } }),
}));

it("does not show another wallet's cached Blend positions after switching accounts", () => {
  const group = {
    protocol: "blend",
    displayName: "Blend · Etherfuse Pool",
    icon: null,
    totalValueUsd: 1,
    positions: [{ name: "XLM Collateral", type: "supply", asset: "XLM", valueUsd: 1 }],
  };
  (useBlendPositions as jest.Mock).mockReturnValue({
    data: { groups: [group], incompletePools: [] },
    isLoading: false,
  });
  const { result, rerender } = renderHook(({ address }) => useDefiPositions(address), {
    initialProps: { address: "WALLET_A" },
  });
  expect(result.current.groups).toHaveLength(1);

  (useBlendPositions as jest.Mock).mockReturnValue({
    data: { groups: [], incompletePools: [] },
    isLoading: false,
  });
  rerender({ address: "WALLET_B" });

  expect(result.current.groups).toHaveLength(0);
});

it("clears Blend positions when the same wallet has an empty successful response", () => {
  const group = {
    protocol: "blend",
    displayName: "Blend · Etherfuse Pool",
    icon: null,
    totalValueUsd: 1,
    positions: [{ name: "XLM Collateral", type: "supply", asset: "XLM", valueUsd: 1 }],
  };
  (useBlendPositions as jest.Mock).mockReturnValue({
    data: { groups: [group], incompletePools: [] },
    isLoading: false,
  });
  const { result, rerender } = renderHook(() => useDefiPositions("WALLET_A"));
  expect(result.current.groups).toHaveLength(1);

  (useBlendPositions as jest.Mock).mockReturnValue({
    data: { groups: [], incompletePools: [] },
    isLoading: false,
  });
  rerender();

  expect(result.current.groups).toHaveLength(0);
});

it("reports an incomplete Blend scan when a pool could not be read", () => {
  (useBlendPositions as jest.Mock).mockReturnValue({
    data: { groups: [], incompletePools: ["ETHERFUSE"] },
    isLoading: false,
    isError: false,
  });

  const { result } = renderHook(() => useDefiPositions("WALLET_A"));

  expect(result.current.groups).toHaveLength(0);
  expect(result.current.incompleteProtocols).toContain("Blend");
});
