"use client";

import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import type { RendererEntry, SharedRenderProps } from "@/features/chat/lib/tool-renderer-registry";
import {
  normalizeAquaPoolFromMcp,
  normalizeAquaPoolsFromMcp,
  normalizeAquaPositionsFromMcp,
  normalizeAquaTxFromMcp,
} from "@/features/protocols/adapters/aquarius-from-mcp";
import {
  AquaPoolDetailCard,
  AquaPoolsCard,
  AquaPositionsCard,
  AquaTxCard,
} from "@/features/protocols/cards/aquarius";

const AQUARIUS_OPS = [
  { toolName: "aquarius_add_liquidity", operation: "add_liquidity" },
  { toolName: "aquarius_withdraw_liquidity", operation: "withdraw_liquidity" },
  { toolName: "aquarius_swap", operation: "swap" },
  { toolName: "aquarius_claim_rewards", operation: "claim_rewards" },
  { toolName: "aquarius_lock_aqua", operation: "lock_aqua" },
] as const;

export const AQUARIUS_RENDERER_ENTRIES: {
  toolName: string;
  entry: RendererEntry & { kind: "shared" | "shared-op" };
}[] = [
  {
    toolName: "aquarius_list_pools",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const pools = normalizeAquaPoolsFromMcp(props.result);
        if (pools?.length > 0) return <AquaPoolsCard pools={pools} mode="playground" />;
        return <PoolInfoCard type="aquarius_pools" result={props.result} status={props.status} />;
      },
    },
  },
  {
    toolName: "aquarius_get_pool_info",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const pool = normalizeAquaPoolFromMcp(props.result);
        if (!pool)
          return (
            <PoolInfoCard type="aquarius_pool_info" result={props.result} status={props.status} />
          );
        return <AquaPoolDetailCard pool={pool} mode="playground" />;
      },
    },
  },
  {
    toolName: "aquarius_track_liquidity",
    entry: {
      kind: "shared",
      render: (props: SharedRenderProps) => {
        const data = normalizeAquaPositionsFromMcp(props.result);
        if (!data)
          return (
            <AccountInfoCard
              type="aquarius_positions"
              result={props.result}
              status={props.status}
            />
          );
        return <AquaPositionsCard data={data} mode="playground" />;
      },
    },
  },
  ...AQUARIUS_OPS.map(({ toolName, operation }) => ({
    toolName,
    entry: {
      kind: "shared-op" as const,
      render: (props: SharedRenderProps) => {
        const tx = normalizeAquaTxFromMcp(props.result, props.args);
        if (!tx)
          return (
            <div className="text-muted-foreground text-xs">Failed to parse transaction data</div>
          );
        return (
          <AquaTxCard
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
