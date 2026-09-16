"use client";

import type { ReactElement } from "react";
import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import type { RendererEntry, SharedRenderProps } from "@/features/chat/lib/tool-renderer-registry";
import { normalizeAquaPoolsFromMcp } from "@/features/protocols/adapters/aquarius-from-mcp";
import { normalizeDefindexVaultsFromMcp } from "@/features/protocols/adapters/defindex-from-mcp";
import {
  normalizeBackstopBalanceFromMcp,
  normalizeBackstopFromMcp,
  normalizeBlendRegistryFromMcp,
  normalizePoolFromMcp,
  normalizePoolsFromMcp,
  normalizePositionsFromMcp,
  normalizeReserveFromMcp,
  normalizeTxFromMcp,
} from "@/features/protocols/adapters/from-mcp";
import { normalizePhoenixPoolsFromMcp } from "@/features/protocols/adapters/phoenix-from-mcp";
import { normalizeSoroswapPoolsFromMcp } from "@/features/protocols/adapters/soroswap-from-mcp";
import { AquaPoolsCard } from "@/features/protocols/cards/aquarius";
import {
  BlendBackstopBalanceCard,
  BlendBackstopInfoCard,
  BlendPoolDetailCard,
  BlendPoolsCard,
  BlendPositionsCard,
  BlendReserveCard,
  BlendTxCard,
} from "@/features/protocols/cards/blend";
import { DefindexVaultsCard } from "@/features/protocols/cards/defindex";
import { PhoenixPoolsCard } from "@/features/protocols/cards/phoenix";
import { SoroswapPoolsCard } from "@/features/protocols/cards/soroswap";

const BLEND_OPS = [
  { toolName: "blend_deposit", operation: "blend_supply" },
  { toolName: "blend_borrow", operation: "blend_borrow" },
  { toolName: "blend_repay", operation: "blend_repay" },
  { toolName: "blend_withdraw", operation: "blend_withdraw" },
  { toolName: "blend_toggle_collateral", operation: "blend_toggle_collateral" },
  { toolName: "blend_claim_emissions", operation: "blend_claim" },
  { toolName: "blend_backstop_deposit", operation: "backstop_deposit" },
  { toolName: "blend_backstop_queue_withdrawal", operation: "backstop_queue" },
  { toolName: "blend_backstop_dequeue_withdrawal", operation: "backstop_dequeue" },
  { toolName: "blend_backstop_withdraw", operation: "backstop_withdraw" },
  { toolName: "blend_join_comet", operation: "join_comet_pool" },
  { toolName: "blend_exit_comet", operation: "exit_comet_pool" },
] as const;

/**
 * resolve_pool is one tool with one shape per protocol: blend returns
 * `pools[]` with reserves, phoenix returns AMM pairs with a `stakeAddress`,
 * defindex returns `vaults[]`, templar returns `markets[]`. Dispatching
 * everything that was not aquarius/soroswap through the Blend adapter put
 * Phoenix results under a "Blend Pools" heading with fabricated "unknown"
 * status badges, and produced nothing at all for defindex and templar because
 * the Blend adapter only ever reads `pools`.
 *
 * Each entry returns null when its adapter finds nothing, so the caller can
 * fall back to the generic PoolInfoCard.
 */
const RESOLVE_POOL_BY_PROTOCOL: Record<string, (props: SharedRenderProps) => ReactElement | null> =
  {
    aquarius: (props) => {
      const pools = normalizeAquaPoolsFromMcp(props.result);
      return pools.length > 0 ? <AquaPoolsCard pools={pools} mode="playground" /> : null;
    },
    soroswap: (props) => {
      const pools = normalizeSoroswapPoolsFromMcp(props.result);
      return pools.length > 0 ? <SoroswapPoolsCard pools={pools} mode="playground" /> : null;
    },
    phoenix: (props) => {
      const pools = normalizePhoenixPoolsFromMcp(props.result);
      return pools.length > 0 ? <PhoenixPoolsCard pools={pools} mode="playground" /> : null;
    },
    defindex: (props) => {
      const vaults = normalizeDefindexVaultsFromMcp(props.result);
      return vaults.length > 0 ? <DefindexVaultsCard vaults={vaults} mode="playground" /> : null;
    },
    blend: (props) => {
      const pools = normalizePoolsFromMcp(props.result);
      if (pools.length === 0) return null;
      return (
        <BlendPoolsCard
          pools={pools}
          mode="playground"
          protocol="blend"
          registry={normalizeBlendRegistryFromMcp(props.result)}
        />
      );
    },
  };

export const BLEND_RENDERER_ENTRIES: {
  toolName: string;
  entry: RendererEntry & { kind: "shared" | "shared-op" };
}[] = [
  {
    toolName: "resolve_pool",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        // No protocol arg means the blend default, which is what the tool
        // itself falls back to.
        const protocol = (props.args as Record<string, string>)?.protocol ?? "blend";
        // templar has no card of its own (its markets carry NEAR market ids,
        // not Stellar contracts), so it deliberately falls through here.
        const card = RESOLVE_POOL_BY_PROTOCOL[protocol]?.(props);
        if (card) return card;
        return <PoolInfoCard type="pool_discovery" result={props.result} status={props.status} />;
      },
    },
  },
  {
    toolName: "blend_get_pool_info",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const pool = normalizePoolFromMcp(props.result);
        if (!pool)
          return (
            <PoolInfoCard type="blend_pool_info" result={props.result} status={props.status} />
          );
        return <BlendPoolDetailCard pool={pool} mode="playground" />;
      },
    },
  },
  {
    toolName: "blend_get_reserve_info",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const reserve = normalizeReserveFromMcp(props.result);
        if (!reserve)
          return (
            <PoolInfoCard type="blend_reserve_info" result={props.result} status={props.status} />
          );
        return <BlendReserveCard reserve={reserve} mode="playground" />;
      },
    },
  },
  {
    toolName: "blend_get_user_position",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const data = normalizePositionsFromMcp(props.result);
        if (!data)
          return (
            <AccountInfoCard
              type="blend_user_position"
              result={props.result}
              status={props.status}
            />
          );
        return <BlendPositionsCard data={data} mode="playground" />;
      },
    },
  },
  {
    toolName: "blend_backstop_get_pool_data",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const backstop = normalizeBackstopFromMcp(props.result);
        if (!backstop)
          return (
            <PoolInfoCard type="blend_backstop_info" result={props.result} status={props.status} />
          );
        return <BlendBackstopInfoCard backstop={backstop} mode="playground" />;
      },
    },
  },
  {
    toolName: "blend_backstop_get_user_balance",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const data = normalizeBackstopBalanceFromMcp(props.result);
        if (!data)
          return (
            <AccountInfoCard
              type="blend_backstop_balance"
              result={props.result}
              status={props.status}
            />
          );
        return <BlendBackstopBalanceCard data={data} mode="playground" />;
      },
    },
  },
  ...BLEND_OPS.map(({ toolName, operation }) => ({
    toolName,
    entry: {
      kind: "shared-op" as const,
      render: (props: SharedRenderProps) => {
        const tx = normalizeTxFromMcp(props.result, props.args);
        if (!tx)
          return (
            <div className="text-muted-foreground text-xs">Failed to parse transaction data</div>
          );
        return (
          <BlendTxCard
            tx={{ ...tx, operation: tx.operation || operation }}
            mode="chat"
            toolCallId={props.toolCallId}
            respond={props.respond}
          />
        );
      },
    },
  })),
];
