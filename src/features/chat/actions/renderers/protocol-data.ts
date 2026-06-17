import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { AccountStrategyCard } from "@/features/chat/actions/components/stellar/account-strategy-card";
import { ActionSearchCard } from "@/features/chat/actions/components/stellar/action-search-card";
import { BridgeDiscoveryCard } from "@/features/chat/actions/components/stellar/bridge-discovery-card";
import { EarnDiscoveryCard } from "@/features/chat/actions/components/stellar/earn-discovery-card";
import { StellarExecuteCard } from "@/features/chat/actions/components/stellar/execute-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import { StrategyPresetCard } from "@/features/chat/actions/components/stellar/strategy-preset-card";
import { SwapQuoteCard } from "@/features/chat/actions/components/stellar/swap-quote-card";
import type { RendererEntry } from "@/features/chat/lib/tool-renderer-registry";

export const TASMIL_INFO_TOOLS = new Set(["get_strategy_presets", "get_account_strategy"]);

export const SUPERVISOR_AGENTS = [
  "info",
  "blend",
  "soroswap",
  "phoenix",
  "aquarius",
  "defindex",
  "templar",
  "allbridge",
  "sdex",
  "bridge",
  "yield",
  "research",
];

export const INFO_ENTRIES: { toolName: string; entry: RendererEntry & { kind: "info" } }[] = [
  {
    toolName: "get_account",
    entry: { kind: "info", component: AccountInfoCard, label: "account_info" },
  },
  {
    toolName: "search_actions",
    entry: { kind: "info", component: ActionSearchCard, label: "action_search" },
  },
  {
    toolName: "swap_get_quote",
    entry: { kind: "info", component: SwapQuoteCard, label: "swap_quote" },
  },
  {
    toolName: "swap_get_pool_liquidity",
    entry: { kind: "info", component: PoolInfoCard, label: "pool_liquidity" },
  },
  {
    toolName: "swap_get_pools",
    entry: { kind: "info", component: PoolInfoCard, label: "pool_list" },
  },
  {
    toolName: "swap_get_pool",
    entry: { kind: "info", component: PoolInfoCard, label: "pool_info" },
  },
  {
    toolName: "swap_get_user_positions",
    entry: { kind: "info", component: AccountInfoCard, label: "user_positions" },
  },
  {
    toolName: "swap_get_price",
    entry: { kind: "info", component: AccountInfoCard, label: "price_info" },
  },
  {
    toolName: "sdex_find_paths",
    entry: { kind: "info", component: AccountInfoCard, label: "sdex_paths" },
  },
  {
    toolName: "sdex_orderbook",
    entry: { kind: "info", component: AccountInfoCard, label: "sdex_orderbook" },
  },
  {
    toolName: "phoenix_query_pools",
    entry: { kind: "info", component: PoolInfoCard, label: "pool_list" },
  },
  {
    toolName: "phoenix_get_pool_info",
    entry: { kind: "info", component: PoolInfoCard, label: "pool_info" },
  },
  {
    toolName: "phoenix_get_user_portfolio",
    entry: { kind: "info", component: AccountInfoCard, label: "user_portfolio" },
  },
  {
    toolName: "phoenix_simulate_swap",
    entry: { kind: "info", component: SwapQuoteCard, label: "swap_simulation" },
  },
  {
    toolName: "phoenix_query_share",
    entry: { kind: "info", component: AccountInfoCard, label: "share_info" },
  },
  {
    toolName: "phoenix_stake_query",
    entry: { kind: "info", component: AccountInfoCard, label: "stake_info" },
  },
  {
    toolName: "bridge_get_routes",
    entry: { kind: "info", component: BridgeDiscoveryCard, label: "bridge_routes" },
  },
  {
    toolName: "bridge_get_quote",
    entry: { kind: "info", component: BridgeDiscoveryCard, label: "bridge_quote" },
  },
  {
    toolName: "allbridge_get_routes",
    entry: { kind: "info", component: BridgeDiscoveryCard, label: "allbridge_routes" },
  },
  {
    toolName: "allbridge_get_quote",
    entry: { kind: "info", component: BridgeDiscoveryCard, label: "allbridge_quote" },
  },
  {
    toolName: "allbridge_pool_deposit_quote",
    entry: { kind: "info", component: PoolInfoCard, label: "allbridge_deposit_quote" },
  },
  {
    toolName: "allbridge_pool_withdraw_quote",
    entry: { kind: "info", component: PoolInfoCard, label: "allbridge_withdraw_quote" },
  },
  {
    toolName: "templar_get_markets",
    entry: { kind: "info", component: PoolInfoCard, label: "market_list" },
  },
  {
    toolName: "templar_get_position",
    entry: { kind: "info", component: AccountInfoCard, label: "user_position" },
  },
  {
    toolName: "templar_swap_quote",
    entry: { kind: "info", component: SwapQuoteCard, label: "swap_quote" },
  },
  {
    toolName: "templar_get_borrow_health",
    entry: { kind: "info", component: AccountInfoCard, label: "borrow_health" },
  },
  {
    toolName: "templar_get_pending_interest",
    entry: { kind: "info", component: AccountInfoCard, label: "pending_interest" },
  },
  {
    toolName: "templar_get_pending_yield",
    entry: { kind: "info", component: AccountInfoCard, label: "pending_yield" },
  },
  {
    toolName: "blend_get_borrow_capacity",
    entry: { kind: "info", component: PoolInfoCard, label: "blend_borrow_cap" },
  },
  {
    toolName: "vault_get_status",
    entry: { kind: "info", component: PoolInfoCard, label: "vault_info" },
  },
  {
    toolName: "vault_get_user_shares",
    entry: { kind: "info", component: AccountInfoCard, label: "user_shares" },
  },
  {
    toolName: "vault_list_vaults",
    entry: { kind: "info", component: PoolInfoCard, label: "vault_list" },
  },
  {
    toolName: "vault_get_apy",
    entry: { kind: "info", component: PoolInfoCard, label: "vault_apy" },
  },
  {
    toolName: "get_strategy_presets",
    entry: { kind: "info", component: StrategyPresetCard, label: "strategy_presets" },
  },
  {
    toolName: "get_account_strategy",
    entry: { kind: "info", component: AccountStrategyCard, label: "account_strategy" },
  },
  {
    toolName: "discover",
    entry: { kind: "info", component: EarnDiscoveryCard, label: "earn_discovery" },
  },
  {
    toolName: "compare_bridge",
    entry: { kind: "info", component: BridgeDiscoveryCard, label: "bridge_routes" },
  },
  {
    toolName: "compare_earn",
    entry: { kind: "info", component: EarnDiscoveryCard, label: "earn_comparison" },
  },
  {
    toolName: "compare_lending",
    entry: { kind: "info", component: PoolInfoCard, label: "lending_comparison" },
  },
];

export const OPERATION_ENTRIES: { toolName: string; entry: RendererEntry & { kind: "operation" } }[] =
  [
    {
      toolName: "swap_build_transaction",
      entry: { kind: "operation", component: StellarExecuteCard, label: "swap_execute" },
    },
    {
      toolName: "swap_add_liquidity",
      entry: { kind: "operation", component: StellarExecuteCard, label: "add_liquidity" },
    },
    {
      toolName: "swap_remove_liquidity",
      entry: { kind: "operation", component: StellarExecuteCard, label: "remove_liquidity" },
    },
    {
      toolName: "sdex_swap",
      entry: { kind: "operation", component: StellarExecuteCard, label: "sdex_swap_execute" },
    },
    {
      toolName: "phoenix_swap",
      entry: { kind: "operation", component: StellarExecuteCard, label: "phoenix_swap_execute" },
    },
    {
      toolName: "phoenix_provide_liquidity",
      entry: { kind: "operation", component: StellarExecuteCard, label: "provide_liquidity" },
    },
    {
      toolName: "phoenix_withdraw_liquidity",
      entry: { kind: "operation", component: StellarExecuteCard, label: "withdraw_liquidity" },
    },
    {
      toolName: "phoenix_stake_bond",
      entry: { kind: "operation", component: StellarExecuteCard, label: "stake_bond" },
    },
    {
      toolName: "phoenix_stake_unbond",
      entry: { kind: "operation", component: StellarExecuteCard, label: "stake_unbond" },
    },
    {
      toolName: "phoenix_stake_claim_rewards",
      entry: { kind: "operation", component: StellarExecuteCard, label: "claim_rewards" },
    },
    {
      toolName: "bridge_build_transaction",
      entry: { kind: "operation", component: StellarExecuteCard, label: "bridge_execute" },
    },
    {
      toolName: "allbridge_build_transaction",
      entry: { kind: "operation", component: StellarExecuteCard, label: "allbridge_execute" },
    },
    {
      toolName: "templar_swap_execute",
      entry: { kind: "operation", component: StellarExecuteCard, label: "templar_swap" },
    },
    {
      toolName: "templar_supply",
      entry: { kind: "operation", component: StellarExecuteCard, label: "templar_supply" },
    },
    {
      toolName: "templar_borrow",
      entry: { kind: "operation", component: StellarExecuteCard, label: "templar_borrow" },
    },
    {
      toolName: "execute_swap",
      entry: { kind: "operation", component: StellarExecuteCard, label: "swap_execute" },
    },
    {
      toolName: "execute_bridge",
      entry: { kind: "operation", component: StellarExecuteCard, label: "bridge_execute" },
    },
    {
      toolName: "execute_earn",
      entry: { kind: "operation", component: StellarExecuteCard, label: "earn_execute" },
    },
    {
      toolName: "execute_lending",
      entry: { kind: "operation", component: StellarExecuteCard, label: "lending_execute" },
    },
    {
      toolName: "vault_deposit",
      entry: { kind: "operation", component: StellarExecuteCard, label: "vault_deposit" },
    },
    {
      toolName: "vault_withdraw",
      entry: { kind: "operation", component: StellarExecuteCard, label: "vault_withdraw" },
    },
    {
      toolName: "vault_withdraw_by_amounts",
      entry: {
        kind: "operation",
        component: StellarExecuteCard,
        label: "vault_withdraw_by_amounts",
      },
    },
  ];
