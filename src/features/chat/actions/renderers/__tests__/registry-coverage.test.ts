// Mock all components/hooks that import the Stellar SDK (which uses native
// Node crypto not available in jsdom). The registry test only checks that tool
// names are registered with the correct kind — it never renders anything.

// Mock stellar components (they import use-tx-signing → stellar-network-check → Stellar SDK)
jest.mock("@/features/chat/actions/components/stellar/execute-card", () => ({
  StellarExecuteCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/account-info-card", () => ({
  AccountInfoCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/account-strategy-card", () => ({
  AccountStrategyCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/action-search-card", () => ({
  ActionSearchCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/bridge-discovery-card", () => ({
  BridgeDiscoveryCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/earn-discovery-card", () => ({
  EarnDiscoveryCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/pool-info-card", () => ({
  PoolInfoCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/strategy-preset-card", () => ({
  StrategyPresetCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/swap-quote-card", () => ({
  SwapQuoteCard: () => null,
}));

jest.mock("@/features/protocols/cards/blend", () => ({
  BlendBackstopBalanceCard: () => null,
  BlendBackstopInfoCard: () => null,
  BlendPoolDetailCard: () => null,
  BlendPoolsCard: () => null,
  BlendPositionsCard: () => null,
  BlendReserveCard: () => null,
  BlendTxCard: () => null,
}));
jest.mock("@/features/protocols/cards/aquarius", () => ({
  AquaLockInfoCard: () => null,
  AquaPoolDetailCard: () => null,
  AquaPoolsCard: () => null,
  AquaPositionsCard: () => null,
  AquaQuoteCard: () => null,
  AquaRewardsCard: () => null,
  AquaTxCard: () => null,
}));
jest.mock("@/features/protocols/cards/soroswap", () => ({
  SoroswapPoolsCard: () => null,
  SoroswapPoolDetailCard: () => null,
  SoroswapPositionsCard: () => null,
  SoroswapTxCard: () => null,
}));
// defindex-tx-card -> use-tx-signing -> stellar-network-check -> Stellar SDK,
// which needs TextEncoder (absent in jsdom). Same reason as the mocks above.
jest.mock("@/features/protocols/cards/defindex", () => ({
  DefindexBalanceCard: () => null,
  DefindexTxCard: () => null,
  DefindexVaultDetailCard: () => null,
  DefindexVaultsCard: () => null,
  DefindexYieldCard: () => null,
}));
// Mock hooks/components imported by flow-renderers that pull in Stellar SDK
jest.mock("@/features/chat/hooks/use-flow-signing", () => ({
  useFlowSigning: () => ({
    signFlow: async () => ({ success: true }),
    stepResults: [],
    currentStep: 0,
    totalSteps: 0,
  }),
}));
jest.mock("@/features/chat/hooks/use-stream", () => ({
  useStreamContext: () => ({ messages: [], submit: async () => {} }),
}));
jest.mock("@/features/chat/components/flow/clarify-card", () => ({
  ClarifyCard: () => null,
}));
jest.mock("@/features/chat/components/flow/execution-card", () => ({
  ExecutionCard: () => null,
}));
jest.mock("@/features/chat/components/flow/plan-preview-card", () => ({
  PlanPreviewCard: () => null,
}));
jest.mock("@/features/chat/actions/components/stellar/account-setup-card", () => ({
  AccountSetupCard: () => null,
}));
jest.mock("@/store/use-wallet", () => ({
  useWalletStore: () => null,
}));
jest.mock("@/features/chat/lib/parse-flow-result", () => ({
  parseFlowResult: () => null,
}));
// (Removed a stale jest.mock of "@/features/chat/hooks/use-defi-tool-renderers":
// that module was deleted, and mocking a non-existent module makes jest abort
// the whole suite with "Could not locate module". Nothing imports it anymore.)
// Mock Stellar SDK-dependent adapters
jest.mock("@/features/protocols/adapters/from-mcp", () => ({
  normalizePoolFromMcp: () => null,
  normalizePoolsFromMcp: () => [],
  normalizeReserveFromMcp: () => null,
  normalizePositionsFromMcp: () => null,
  normalizeTxFromMcp: () => null,
  normalizeBackstopFromMcp: () => null,
  normalizeBackstopBalanceFromMcp: () => null,
  unwrapMcpResult: () => ({ data: null, error: null }),
}));
jest.mock("@/features/protocols/adapters/aquarius-from-mcp", () => ({
  normalizeAquaPoolFromMcp: () => null,
  normalizeAquaPoolsFromMcp: () => [],
  normalizeAquaPositionsFromMcp: () => null,
  normalizeAquaTxFromMcp: () => null,
}));
jest.mock("@/features/protocols/adapters/soroswap-from-mcp", () => ({
  normalizeSoroswapPoolsFromMcp: () => [],
}));

import { toolRendererRegistry } from "@/features/chat/lib/tool-renderer-registry";
import "@/features/chat/actions/renderers/index";

describe("toolRendererRegistry coverage", () => {
  it("registers get_account (info)", () => {
    expect(toolRendererRegistry.get("get_account")?.kind).toBe("info");
  });
  it("registers swap_get_quote (info)", () => {
    expect(toolRendererRegistry.has("swap_get_quote")).toBe(true);
  });
  it("registers get_strategy_presets (info)", () => {
    expect(toolRendererRegistry.has("get_strategy_presets")).toBe(true);
  });
  it("registers swap_build_transaction (operation)", () => {
    expect(toolRendererRegistry.get("swap_build_transaction")?.kind).toBe("operation");
  });
  it("registers blend_deposit (shared-op) — was broken before", () => {
    expect(toolRendererRegistry.get("blend_deposit")?.kind).toBe("shared-op");
  });
  it("registers blend_get_pool_info (shared) — was broken before", () => {
    expect(toolRendererRegistry.get("blend_get_pool_info")?.kind).toBe("shared");
  });
  it("registers aquarius_list_pools (shared) — was broken before", () => {
    expect(toolRendererRegistry.get("aquarius_list_pools")?.kind).toBe("shared");
  });
  it("registers aquarius_add_liquidity (shared-op) — was broken before", () => {
    expect(toolRendererRegistry.get("aquarius_add_liquidity")?.kind).toBe("shared-op");
  });
  it("registers execute (shared-op)", () => {
    expect(toolRendererRegistry.get("execute")?.kind).toBe("shared-op");
  });
  it("registers flow_clarify (shared)", () => {
    expect(toolRendererRegistry.get("flow_clarify")?.kind).toBe("shared");
  });
  it("registers flow_compose_and_execute (shared)", () => {
    expect(toolRendererRegistry.has("flow_compose_and_execute")).toBe(true);
  });
  it("registry has at least 60 entries", () => {
    expect(toolRendererRegistry.size).toBeGreaterThanOrEqual(60);
  });
});
