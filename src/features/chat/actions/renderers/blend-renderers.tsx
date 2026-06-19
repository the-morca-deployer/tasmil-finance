"use client";

import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import type { RendererEntry, SharedRenderProps } from "@/features/chat/lib/tool-renderer-registry";
import { normalizeAquaPoolsFromMcp } from "@/features/protocols/adapters/aquarius-from-mcp";
import {
  normalizeBackstopBalanceFromMcp,
  normalizeBackstopFromMcp,
  normalizePoolFromMcp,
  normalizePoolsFromMcp,
  normalizePositionsFromMcp,
  normalizeReserveFromMcp,
  normalizeTxFromMcp,
} from "@/features/protocols/adapters/from-mcp";
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

export const BLEND_RENDERER_ENTRIES: {
  toolName: string;
  entry: RendererEntry & { kind: "shared" | "shared-op" };
}[] = [
  {
    toolName: "resolve_pool",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const protocol = (props.args as Record<string, string>)?.protocol;
        if (protocol === "aquarius") {
          const pools = normalizeAquaPoolsFromMcp(props.result);
          if (pools.length > 0) return <AquaPoolsCard pools={pools} mode="playground" />;
        } else if (protocol === "soroswap") {
          const pools = normalizeSoroswapPoolsFromMcp(props.result);
          if (pools.length > 0) return <SoroswapPoolsCard pools={pools} mode="playground" />;
        } else {
          const pools = normalizePoolsFromMcp(props.result);
          if (pools.length > 0) return <BlendPoolsCard pools={pools} mode="playground" />;
        }
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
