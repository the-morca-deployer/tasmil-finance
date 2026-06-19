"use client";

import type React from "react";
import { StellarExecuteCard } from "@/features/chat/actions/components/stellar/execute-card";
import type { SharedRenderProps } from "@/features/chat/lib/tool-renderer-registry";
import { normalizeAquaTxFromMcp } from "@/features/protocols/adapters/aquarius-from-mcp";
import { normalizeTxFromMcp, unwrapMcpResult } from "@/features/protocols/adapters/from-mcp";
import { AquaTxCard } from "@/features/protocols/cards/aquarius";
import { BlendTxCard } from "@/features/protocols/cards/blend";

const BLEND_ACTION_MAP: Record<string, string> = {
  supply: "blend_supply",
  supply_collateral: "blend_supply",
  deposit_for_yield: "blend_supply",
  deposit: "blend_supply",
  borrow: "blend_borrow",
  repay: "blend_repay",
  withdraw: "blend_withdraw",
  withdraw_collateral: "blend_withdraw",
  claim_emissions: "blend_claim",
  backstop_deposit: "backstop_deposit",
  backstop_queue_withdrawal: "backstop_queue",
  backstop_dequeue_withdrawal: "backstop_dequeue",
  backstop_withdraw: "backstop_withdraw",
  join_comet_pool: "join_comet_pool",
  exit_comet_pool: "exit_comet_pool",
};

const AQUARIUS_ACTIONS = new Set([
  "add_liquidity",
  "remove_liquidity",
  "swap",
  "claim_rewards",
  "lock_aqua",
]);

export function executeDispatchRender(props: SharedRenderProps): React.ReactElement {
  const { data } = unwrapMcpResult(props.result);
  const d = data as Record<string, unknown>;
  const action = String(d?.action ?? props.args?.action ?? "");
  const protocol = String(d?.protocol ?? props.args?.protocol ?? "");

  const blendOp = BLEND_ACTION_MAP[action];
  if (blendOp || protocol === "blend") {
    const tx = normalizeTxFromMcp(props.result, props.args);
    if (tx) {
      return (
        <BlendTxCard
          tx={{ ...tx, operation: blendOp || tx.operation || action }}
          mode="chat"
          toolCallId={props.toolCallId}
          respond={props.respond}
        />
      );
    }
  }

  if (AQUARIUS_ACTIONS.has(action) && protocol === "aquarius") {
    const tx = normalizeAquaTxFromMcp(props.result, props.args);
    if (tx) {
      return (
        <AquaTxCard
          tx={{ ...tx, operation: tx.operation || action }}
          mode="chat"
          toolCallId={props.toolCallId}
          respond={props.respond}
        />
      );
    }
  }

  return (
    <StellarExecuteCard
      tx={{
        operation: action || "execute",
        protocol,
        xdr: String(d?.xdr ?? ""),
        amount: (d?.amount as string) ?? null,
        symbol: (d?.symbol as string) ?? null,
        estimatedFee: d?.estimatedFee as string | undefined,
        context: d?.context as Record<string, unknown> | undefined,
      }}
      operation={action || "execute"}
      args={props.args}
      result={props.result}
      status={props.status === "inProgress" ? "executing" : props.status}
      respond={props.respond}
    />
  );
}
