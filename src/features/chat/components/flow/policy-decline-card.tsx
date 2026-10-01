"use client";

import Link from "next/link";
import type { PolicyDecisionMessage } from "@/features/chat/types/flow-messages";

const titleByRule = {
  NET_EDGE: "Net-Edge declined",
  PRICE_INTEGRITY: "Price evidence refused",
  POLICY: "Policy declined",
  WASM_PIN: "Contract code refused",
  EXECUTION: "Execution status",
} as const;

function Arithmetic({ value }: { value: PolicyDecisionMessage["policyDecision"]["arithmetic"] }) {
  if (value.kind === "NET_EDGE") {
    return (
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {[
          ["Gross", value.expectedGrossGainUsdMicros],
          ["Costs", value.costTotalUsdMicros],
          ["Uncertainty", value.uncertaintyHaircutUsdMicros],
          ["Net edge", value.netEdgeUsdMicros],
        ].map(([label, amount]) => (
          <div className="rounded-lg bg-white/[0.04] p-2" key={label}>
            <dt className="text-[#9aada4]">{label}</dt>
            <dd className="break-all font-mono text-[#f0f2f1]">{amount}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <pre className="mt-3 whitespace-pre-wrap break-all rounded-lg bg-white/[0.04] p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function PolicyDeclineCard({
  message,
  onRefreshStatus,
}: {
  message: PolicyDecisionMessage;
  onRefreshStatus?: (decisionId: string) => void;
}) {
  const decision = message.policyDecision;
  const network = decision.observations[0]?.network;
  const txExplorer =
    decision.txHash && network
      ? `https://stellar.expert/explorer/${network === "mainnet" ? "public" : "testnet"}/tx/${decision.txHash}`
      : null;
  return (
    <div
      className="rounded-xl border border-amber-500/20 bg-[#131715] p-4"
      data-testid="card-policy-decision"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-[#f0f2f1] text-sm">{titleByRule[decision.rule]}</p>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs">
          {decision.status}
        </span>
      </div>
      <p className="mt-2 text-[#c9d4ce] text-sm">{message.message}</p>
      <Arithmetic value={decision.arithmetic} />
      <p className="mt-3 break-all font-mono text-[#5e736a] text-xs">
        Decision {decision.decisionId}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {decision.status === "UNKNOWN" &&
          (onRefreshStatus ? (
            <button
              className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-amber-200 text-xs"
              onClick={() => onRefreshStatus(decision.decisionId)}
              type="button"
            >
              Refresh status
            </button>
          ) : (
            <Link
              className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-amber-200 text-xs"
              href={`/activity/${encodeURIComponent(decision.decisionId)}?refresh=1`}
            >
              Refresh status
            </Link>
          ))}
        {decision.status === "CONFIRMED" && txExplorer && (
          <a
            className="text-blue-400 text-xs hover:underline"
            href={txExplorer}
            rel="noreferrer"
            target="_blank"
          >
            View transaction
          </a>
        )}
        <Link
          className="text-blue-400 text-xs hover:underline"
          href={`/activity/${encodeURIComponent(decision.decisionId)}`}
        >
          Replay evidence
        </Link>
      </div>
    </div>
  );
}
