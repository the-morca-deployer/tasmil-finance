import { fireEvent, render, screen } from "@testing-library/react";
import type { DiscoveredPool } from "../../types";
import { ManageTab } from "./manage-tab";

const usdcPool: DiscoveredPool = {
  id: "p-usdc",
  protocol: "blend",
  poolAddress: "C...",
  reserveIndex: 0,
  poolType: "lending",
  assetSymbol: "USDC",
  currentApy: 0.05,
  tvlUsd: 1_000_000,
  riskScore: 3,
  strategyContractAddress: "C...",
} as unknown as DiscoveredPool;
const xlmPool: DiscoveredPool = { ...usdcPool, id: "p-xlm", assetSymbol: "XLM" };

describe("ManageTab", () => {
  it("renders Strategy and Pools sections", () => {
    render(
      <ManageTab
        presets={[]}
        presetsLoading={false}
        selectedPreset={null}
        onSelectPreset={() => {}}
        currentPreset="BALANCED"
        previewAsset="USDC"
        onChangePreviewAsset={() => {}}
        activeAssets={["USDC"]}
        isRevoked={false}
        isUpdatingPreset={false}
        actionError={null}
        onApply={() => {}}
        pools={[]}
        poolsLoading={false}
      />,
    );
    expect(screen.getByText(/choose your strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/available pools/i)).toBeInTheDocument();
  });

  it("filters pools by previewAsset", () => {
    const { container } = render(
      <ManageTab
        presets={[]}
        presetsLoading={false}
        selectedPreset={null}
        onSelectPreset={() => {}}
        currentPreset="BALANCED"
        previewAsset="USDC"
        onChangePreviewAsset={() => {}}
        activeAssets={["USDC"]}
        isRevoked={false}
        isUpdatingPreset={false}
        actionError={null}
        onApply={() => {}}
        pools={[usdcPool, xlmPool]}
        poolsLoading={false}
      />,
    );
    const dataRows = container.querySelectorAll('[data-pools-row="true"]');
    expect(dataRows.length).toBe(1);
  });

  it("toggles previewAsset on USDC/XLM chip click", () => {
    const onChangePreviewAsset = jest.fn();
    render(
      <ManageTab
        presets={[]}
        presetsLoading={false}
        selectedPreset={null}
        onSelectPreset={() => {}}
        currentPreset="BALANCED"
        previewAsset="USDC"
        onChangePreviewAsset={onChangePreviewAsset}
        activeAssets={["USDC"]}
        isRevoked={false}
        isUpdatingPreset={false}
        actionError={null}
        onApply={() => {}}
        pools={[]}
        poolsLoading={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^XLM$/ }));
    expect(onChangePreviewAsset).toHaveBeenCalledWith("XLM");
  });
});
