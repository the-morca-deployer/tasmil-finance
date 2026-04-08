"use client";

import type { ComponentType } from "react";
import { SwapQuoteCard } from "./swap-quote-card";
import { BridgeDiscoveryCard } from "./bridge-discovery-card";
import { EarnDiscoveryCard } from "./earn-discovery-card";
import { AccountInfoCard } from "./account-info-card";
import { PoolInfoCard } from "./pool-info-card";
import { ActionSearchCard } from "./action-search-card";

/**
 * Maps the `type` prop (from backend config.yaml info_tools) to the correct React component.
 */
const InfoComponentMap: Record<string, ComponentType<any>> = {
  // Swap agent
  swap_quote: SwapQuoteCard,

  // Bridge agent
  bridge_discovery: BridgeDiscoveryCard,

  // Vault / Yield / Staking agents
  earn_discovery: EarnDiscoveryCard,
  staking_discovery: EarnDiscoveryCard,
  yield_discovery: EarnDiscoveryCard,
  discovery: EarnDiscoveryCard,

  // Research / Info agents
  market_discovery: AccountInfoCard,
  account_info: AccountInfoCard,
  price_info: AccountInfoCard,

  // Shared
  pool_info: PoolInfoCard,
  action_search: ActionSearchCard,
};

interface StellarInfoDispatcherProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

/**
 * Dispatcher component for all `{ui_prefix}-info` UI messages.
 * Routes to the correct Stellar info card based on `type` prop from backend.
 */
export function StellarInfoDispatcher({ type, ...props }: StellarInfoDispatcherProps) {
  const Component = InfoComponentMap[type ?? ""] ?? AccountInfoCard;
  return <Component type={type} {...props} />;
}
