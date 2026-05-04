import type { CardType } from "../page-objects/chat.page";

export interface ProtocolTestCase {
  prompt: string;
  /** Primary card expected. May see ClarifyCard first for ambiguous prompts. */
  expectedCard: CardType;
  /** Acceptable intermediate cards (e.g., clarify before execute). */
  acceptableCards?: CardType[];
  /** Expected MCP tool name in LangSmith trace. */
  expectedTool?: string;
  /** Key text fragments that should be visible in the card. */
  assertions: {
    amountVisible?: string;
    assetVisible?: string;
    protocolVisible?: string;
    textContains?: string[];
  };
}

export interface ProtocolSuite {
  [action: string]: ProtocolTestCase;
}

// =============================================================================
// BLEND LENDING PROTOCOL
// =============================================================================
export const BLEND_TESTS: ProtocolSuite = {
  supply: {
    prompt: "Supply 100 USDC to Blend lending pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "100", assetVisible: "USDC", protocolVisible: "Blend" },
  },
  withdraw: {
    prompt: "Withdraw 50 USDC from Blend lending",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "50", assetVisible: "USDC" },
  },
  borrow: {
    prompt: "Borrow 30 XLM from Blend using my USDC as collateral",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "30", assetVisible: "XLM" },
  },
  repay: {
    prompt: "Repay 30 XLM loan on Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "30", assetVisible: "XLM" },
  },
  claim_emissions: {
    prompt: "Claim my BLND emissions from Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { assetVisible: "BLND" },
  },
  toggle_collateral: {
    prompt: "Enable USDC as collateral on Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { assetVisible: "USDC" },
  },
};

// =============================================================================
// BLEND BACKSTOP
// =============================================================================
export const BLEND_BACKSTOP_TESTS: ProtocolSuite = {
  backstop_deposit: {
    prompt: "Deposit 200 BLND-USDC LP to Blend backstop",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { protocolVisible: "Blend" },
  },
  backstop_queue_withdrawal: {
    prompt: "Queue withdrawal of my Blend backstop position",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: {},
  },
  backstop_dequeue_withdrawal: {
    prompt: "Cancel my queued backstop withdrawal on Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: {},
  },
  backstop_withdraw: {
    prompt: "Withdraw my unlocked Blend backstop position",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: {},
  },
  join_comet_pool: {
    prompt: "Join the Comet 80/20 BLND-USDC pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { textContains: ["Comet"] },
  },
  exit_comet_pool: {
    prompt: "Exit the Comet BLND-USDC pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { textContains: ["Comet"] },
  },
};

// =============================================================================
// AQUARIUS AMM
// =============================================================================
export const AQUARIUS_TESTS: ProtocolSuite = {
  add_liquidity: {
    prompt: "Add liquidity to USDC/XLM pool on Aquarius with 100 USDC",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-aqua-tx"],
    expectedTool: "execute",
    assertions: { amountVisible: "100", assetVisible: "USDC" },
  },
  remove_liquidity: {
    prompt: "Remove my liquidity from Aquarius USDC/XLM pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-aqua-tx"],
    expectedTool: "execute",
    assertions: {},
  },
  swap: {
    prompt: "Swap 50 USDC to XLM on Aquarius",
    expectedCard: "card-swap-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "50", assetVisible: "USDC" },
  },
  claim_rewards: {
    prompt: "Claim my AQUA rewards",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { assetVisible: "AQUA" },
  },
  lock_aqua: {
    prompt: "Lock 1000 AQUA for ICE voting power",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "1000", assetVisible: "AQUA" },
  },
};

// =============================================================================
// SOROSWAP DEX
// =============================================================================
export const SOROSWAP_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Swap 50 XLM to USDC on Soroswap",
    expectedCard: "card-swap-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "50", assetVisible: "XLM" },
  },
  add_liquidity: {
    prompt: "Add liquidity to Soroswap XLM/USDC pool with 100 USDC",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "100" },
  },
  remove_liquidity: {
    prompt: "Remove my liquidity from Soroswap XLM/USDC pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: {},
  },
};

// =============================================================================
// SDEX (Stellar Classic DEX)
// =============================================================================
export const SDEX_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Buy 100 USDC with XLM on the Stellar DEX",
    expectedCard: "card-swap-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "100", assetVisible: "USDC" },
  },
};

// =============================================================================
// PHOENIX DEX
// =============================================================================
export const PHOENIX_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Swap 25 XLM to USDC on Phoenix",
    expectedCard: "card-swap-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "25", assetVisible: "XLM" },
  },
  add_liquidity: {
    prompt: "Add liquidity to Phoenix XLM/USDC pool with 50 XLM",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "50" },
  },
  remove_liquidity: {
    prompt: "Remove my liquidity from Phoenix XLM/USDC pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: {},
  },
};

// =============================================================================
// ALLBRIDGE (Cross-chain Bridge)
// =============================================================================
export const ALLBRIDGE_TESTS: ProtocolSuite = {
  bridge: {
    prompt: "Bridge 100 USDC from Stellar to Ethereum via Allbridge",
    expectedCard: "card-bridge-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "100", assetVisible: "USDC" },
  },
};

// =============================================================================
// TEMPLAR
// =============================================================================
export const TEMPLAR_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Swap 100 USDC to XLM on Templar",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-swap-execute", "card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "100", assetVisible: "USDC" },
  },
};

// =============================================================================
// DEFINDEX VAULTS
// =============================================================================
export const DEFINDEX_TESTS: ProtocolSuite = {
  deposit: {
    prompt: "Deposit 200 USDC into DeFindex vault",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: { amountVisible: "200", assetVisible: "USDC" },
  },
  withdraw: {
    prompt: "Withdraw my position from DeFindex vault",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    expectedTool: "execute",
    assertions: {},
  },
};

// =============================================================================
// TASMIL MANAGED STRATEGIES
// =============================================================================
export const TASMIL_TESTS: ProtocolSuite = {
  deploy_account: {
    prompt: "Deploy my Tasmil smart account",
    expectedCard: "card-account-setup",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "deploy_smart_account",
    assertions: { textContains: ["Deploy", "account"] },
  },
  setup_account: {
    prompt: "Setup my Tasmil account session key",
    expectedCard: "card-account-setup",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "setup_smart_account",
    assertions: { textContains: ["Setup", "session"] },
  },
  fund_account: {
    prompt: "Fund my Tasmil account with 500 USDC",
    expectedCard: "card-account-setup",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    expectedTool: "fund_smart_account",
    assertions: { amountVisible: "500", assetVisible: "USDC" },
  },
  apply_preset: {
    prompt: "Change my Tasmil strategy to Balanced preset",
    expectedCard: "card-strategy-preset",
    acceptableCards: ["card-account-strategy", "card-clarify"],
    expectedTool: "apply_strategy_preset",
    assertions: { textContains: ["Balanced"] },
  },
};

// =============================================================================
// AGGREGATED: All protocols in one map
// =============================================================================
export const ALL_PROTOCOL_TESTS = {
  blend: BLEND_TESTS,
  "blend-backstop": BLEND_BACKSTOP_TESTS,
  aquarius: AQUARIUS_TESTS,
  soroswap: SOROSWAP_TESTS,
  sdex: SDEX_TESTS,
  phoenix: PHOENIX_TESTS,
  allbridge: ALLBRIDGE_TESTS,
  templar: TEMPLAR_TESTS,
  defindex: DEFINDEX_TESTS,
  tasmil: TASMIL_TESTS,
} as const;
