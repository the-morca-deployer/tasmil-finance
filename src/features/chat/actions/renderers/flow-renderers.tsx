"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { AccountSetupCard } from "@/features/chat/actions/components/stellar/account-setup-card";
import { ClarifyCard } from "@/features/chat/components/flow/clarify-card";
import { ExecutionCard } from "@/features/chat/components/flow/execution-card";
import { PlanPreviewCard } from "@/features/chat/components/flow/plan-preview-card";
import { useFlowSigning } from "@/features/chat/hooks/use-flow-signing";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import { parseFlowResult } from "@/features/chat/lib/parse-flow-result";
import type { SharedRenderProps } from "@/features/chat/lib/tool-renderer-registry";
import type { TxStatus } from "@/features/chat/types/flow-messages";
import type { SponsorTxMeta } from "@/features/sponsorship";
import { useWalletStore } from "@/store/use-wallet";
import { executeDispatchRender } from "./execute-dispatcher";

// Fallback used only when the AI step has no protocol/action at all.
const DEFAULT_TX_META: SponsorTxMeta = { action: "DEPOSIT", protocol: "TASMIL_VAULT" };

// AI agent emits lowercase protocols ("blend", "soroswap", …) matching the
// MCP execute-tool param. Sponsor backend stores uppercase enum values, so
// we normalize here. Unknown / "stellar" (trustline) falls back to vault.
const PROTOCOL_MAP: Record<string, SponsorTxMeta["protocol"]> = {
  blend: "BLEND",
  soroswap: "SOROSWAP",
  aquarius: "AQUARIUS",
  phoenix: "PHOENIX",
  defindex: "DEFINDEX",
  stellar: "TASMIL_VAULT",
};

// AI emits many fine-grained actions (deposit / supply_collateral / swap /
// stake / add_liquidity / withdraw / unstake / remove_liquidity /
// add_trustline / …). Collapse onto the 4 sponsor enum buckets.
function normalizeAction(raw: string | undefined): SponsorTxMeta["action"] {
  if (!raw) return DEFAULT_TX_META.action;
  const lower = raw.toLowerCase();
  if (lower.includes("withdraw") || lower.includes("unstake") || lower.includes("remove")) {
    return "WITHDRAW";
  }
  if (lower.includes("harvest") || lower.includes("claim")) return "HARVEST";
  if (lower.includes("rebalance")) return "REBALANCE";
  // deposit, supply_collateral, swap, stake, add_liquidity, add_trustline,
  // and other onboarding-shaped ops all map to DEPOSIT.
  return "DEPOSIT";
}

function normalizeProtocol(raw: string | undefined): SponsorTxMeta["protocol"] {
  if (!raw) return DEFAULT_TX_META.protocol;
  return PROTOCOL_MAP[raw.toLowerCase()] ?? DEFAULT_TX_META.protocol;
}

function deriveMetasFromSteps(
  steps: Record<string, unknown>[] | undefined,
  count: number
): SponsorTxMeta[] {
  return Array.from({ length: count }, (_, i) => {
    const s = steps?.[i] ?? {};
    const action = normalizeAction(s.action as string | undefined);
    const protocol = normalizeProtocol(s.protocol as string | undefined);
    const asset = (s.asset as string | undefined) ?? (s.assetCode as string | undefined);
    const poolLabel = (s.poolLabel as string | undefined) ?? (s.description as string | undefined);
    return { action, protocol, asset, poolLabel };
  });
}

function simplifyErrorMessage(raw: string): string {
  const stepsMatch = raw.match(/All \d+ steps? failed/);
  if (stepsMatch) {
    const simMatch = raw.match(
      /Contract simulation failed:\s*HostError:\s*Error\(Contract,\s*#(\d+)\)/
    );
    if (simMatch)
      return `Transaction simulation failed (contract error #${simMatch[1]}). The AI will suggest an alternative.`;
    return "Transaction simulation failed. The AI will suggest an alternative.";
  }
  if (raw.includes("Contract simulation failed")) {
    const codeMatch = raw.match(/Error\(Contract,\s*#(\d+)\)/);
    if (codeMatch) return `Transaction simulation failed (contract error #${codeMatch[1]}).`;
    return "Transaction simulation failed.";
  }
  return raw.length > 200 ? `${raw.slice(0, 150)}…` : raw;
}

type ClarifyQuestion = {
  field_name: string;
  question: string;
  input_type: "select" | "text";
  suggestions?: {
    label: string;
    value: Record<string, unknown>;
    tags?: string[];
    description?: string;
  }[];
  placeholder?: string;
};

function usePreviousClarifyResponse(questions: ClarifyQuestion[], toolCallId?: string) {
  const stream = useStreamContext();
  return useMemo(() => {
    const msgs = stream.messages ?? [];
    let startIdx = 0;
    if (toolCallId) {
      const idx = msgs.findIndex(
        (m) => m.type === "tool" && (m as any).tool_call_id === toolCallId
      );
      if (idx >= 0) startIdx = idx + 1;
    }
    for (let i = startIdx; i < msgs.length; i++) {
      const m = msgs[i]!;
      if (m.type !== "human") continue;
      const content = typeof m.content === "string" ? m.content : "";
      if (!content.includes("clarify_response")) continue;
      try {
        const parsed = JSON.parse(content);
        if (parsed?.type !== "clarify_response") continue;
        const answers: Record<string, unknown> = {};
        for (const q of questions) {
          if (q.input_type === "select" && q.suggestions) {
            const match = q.suggestions.find((s) =>
              Object.entries(s.value).every(([k, v]) => parsed[k] === v)
            );
            if (match) answers[q.field_name] = match.value;
          } else if (q.input_type === "text" && parsed[q.field_name]) {
            answers[q.field_name] = parsed[q.field_name];
          }
        }
        if (Object.keys(answers).length > 0) return answers;
      } catch {}
    }
    return null;
  }, [stream.messages, questions, toolCallId]);
}

function FlowClarifyCardWithStream({
  questions,
  context,
  toolCallId,
}: {
  questions: ClarifyQuestion[];
  context?: Record<string, unknown>;
  toolCallId?: string;
}) {
  const stream = useStreamContext();
  const walletAddress = useWalletStore((s) => s.account);
  const previousAnswers = usePreviousClarifyResponse(questions, toolCallId);
  const [sent, setSent] = useState(!!previousAnswers);

  const handleSubmit = useCallback(
    async (answers: Record<string, unknown>) => {
      if (sent) return;
      setSent(true);
      const payload: Record<string, unknown> = { type: "clarify_response" };
      for (const q of questions) {
        const answer = answers[q.field_name];
        if (q.input_type === "select" && answer && typeof answer === "object")
          Object.assign(payload, answer);
        else if (q.input_type === "text" && typeof answer === "string" && answer.trim())
          payload[q.field_name] = answer.trim();
      }
      if (context) {
        for (const [k, v] of Object.entries(context)) {
          if (v !== undefined && v !== null && !(k in payload)) payload[k] = v;
        }
      }
      try {
        await stream.submit({
          messages: [{ type: "human" as const, content: JSON.stringify(payload) }],
          ...(walletAddress && { wallet_address: walletAddress }),
        });
      } catch (err) {
        console.error("[FlowClarifyCard] submit error:", err);
        setSent(false);
      }
    },
    [stream, questions, context, sent, walletAddress]
  );

  return (
    <ClarifyCard
      questions={questions}
      onSubmit={handleSubmit}
      disabled={sent}
      initialAnswers={previousAnswers ?? undefined}
    />
  );
}

function FlowPlanWithSigning({
  plan,
  simulationReport,
}: {
  plan: Record<string, unknown>;
  simulationReport?: Record<string, unknown>;
}) {
  const { signFlow, stepResults, currentStep, totalSteps } = useFlowSigning();
  const [phase, setPhase] = useState<"preview" | "signing" | "done" | "error">("preview");
  const [error, setError] = useState<string | undefined>();
  const xdrs = (simulationReport?.xdrs as string[]) || [];
  // Prefer metas[] from the AI simulation report when present; otherwise
  // derive per-step meta from plan.steps (action/protocol/asset/poolLabel).
  const metas = useMemo<SponsorTxMeta[]>(() => {
    const fromReport = simulationReport?.metas as SponsorTxMeta[] | undefined;
    if (fromReport && fromReport.length === xdrs.length) return fromReport;
    const steps = (plan as { steps?: Record<string, unknown>[] })?.steps;
    return deriveMetasFromSteps(steps, xdrs.length);
  }, [simulationReport, plan, xdrs.length]);

  const handleConfirm = useCallback(async () => {
    if (xdrs.length === 0) return;
    setPhase("signing");
    const result = await signFlow(xdrs, metas);
    if (result.success) setPhase("done");
    else {
      setPhase("error");
      setError(result.error || "Transaction failed");
    }
  }, [xdrs, metas, signFlow]);

  if (phase !== "preview") {
    const latestResult = stepResults[currentStep] || stepResults[stepResults.length - 1];
    return (
      <ExecutionCard
        step={currentStep}
        totalSteps={totalSteps || xdrs.length}
        status={
          (phase === "done" ? "confirmed" : phase === "error" ? "failed" : "submitting") as TxStatus
        }
        txHash={latestResult?.txHash}
        error={error}
      />
    );
  }

  return (
    <PlanPreviewCard
      plan={plan as any}
      simulationReport={simulationReport as any}
      onConfirm={handleConfirm}
      onCancel={() => {}}
    />
  );
}

function renderComposePlan(props: SharedRenderProps): React.ReactElement {
  const data = parseFlowResult(props.result);
  if (!data)
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Composing plan...
      </div>
    );
  if (data.kind === "error")
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
        {simplifyErrorMessage((data.message as string) || "Transaction failed")}
      </div>
    );
  if (data.kind === "cross_chain_plan" || data.kind === "plan_preview")
    return (
      <FlowPlanWithSigning
        plan={(data.plan as Record<string, unknown>) || {}}
        simulationReport={data.simulation_report as Record<string, unknown>}
      />
    );
  if (data.multi_step && Array.isArray(data.steps)) {
    const steps = data.steps as Record<string, unknown>[];
    const card = (
      <FlowPlanWithSigning
        plan={{
          steps: steps.map((s, i) => ({
            index: i,
            action: s.action,
            protocol: s.protocol,
            description: s.description,
            asset: (s.asset as string) ?? (s.assetCode as string),
          })),
        }}
        simulationReport={{ xdrs: steps.map((s) => s.xdr as string).filter(Boolean) }}
      />
    );
    const stop = data._stop_text as string | undefined;
    return stop ? (
      <div>
        {card}
        <div className="mt-2 text-center text-muted-foreground text-xs">{stop}</div>
      </div>
    ) : (
      card
    );
  }
  const card = executeDispatchRender({
    ...props,
    result: data,
    args: {
      ...(props.args as Record<string, unknown>),
      protocol: data.protocol as string,
      action: data.action as string,
    },
  });
  const stop = data._stop_text as string | undefined;
  return stop ? (
    <div>
      {card}
      <div className="mt-2 text-center text-muted-foreground text-xs">{stop}</div>
    </div>
  ) : (
    card
  );
}

export const FLOW_RENDERER_ENTRIES: {
  toolName: string;
  render: (props: SharedRenderProps) => React.ReactElement;
}[] = [
  {
    toolName: "flow_clarify",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (data?.kind === "error")
        return (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            {(data.message as string) || "Failed to load options"}
          </div>
        );
      if (!data) {
        const errorText =
          typeof props.result === "string"
            ? props.result
            : typeof props.result === "object" && props.result !== null
              ? JSON.stringify(props.result)
              : null;
        if (errorText && errorText.length > 0 && errorText.length < 500)
          return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
              {errorText}
            </div>
          );
        return <div className="text-muted-foreground text-xs">Invalid clarify data</div>;
      }
      let questions = data.questions as ClarifyQuestion[] | undefined;
      if (!questions && data.question)
        questions = [
          {
            field_name: "q0",
            question: data.question as string,
            input_type: "select",
            suggestions: (data.suggestions as any[]) ?? [],
          },
        ];
      if (!questions || questions.length === 0)
        return <div className="text-muted-foreground text-xs">No questions</div>;
      return (
        <FlowClarifyCardWithStream
          questions={questions}
          context={(data._context ?? {}) as Record<string, unknown>}
          toolCallId={props.toolCallId}
        />
      );
    },
  },
  {
    toolName: "flow_plan_preview",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (!data?.plan)
        return <div className="text-muted-foreground text-xs">Invalid plan data</div>;
      return (
        <PlanPreviewCard
          plan={data.plan as any}
          simulationReport={data.simulation_report as any}
          onConfirm={() => props.respond?.({ kind: "plan_confirm", action: "confirm" })}
          onCancel={() => props.respond?.({ kind: "plan_cancel", action: "cancel" })}
        />
      );
    },
  },
  { toolName: "flow_compose_plan", render: renderComposePlan },
  {
    toolName: "flow_compose_and_execute",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (!data) return <div className="text-muted-foreground text-xs">No transaction data</div>;
      if (data.kind === "error")
        return (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            {simplifyErrorMessage((data.message as string) || "Transaction failed")}
          </div>
        );
      if (data.kind === "cross_chain_plan" || data.kind === "plan_preview")
        return (
          <FlowPlanWithSigning
            plan={(data.plan as Record<string, unknown>) || {}}
            simulationReport={data.simulation_report as Record<string, unknown>}
          />
        );
      if (data.multi_step && Array.isArray(data.steps)) {
        const steps = data.steps as Record<string, unknown>[];
        return (
          <FlowPlanWithSigning
            plan={{
              steps: steps.map((s, i) => ({
                index: i,
                action: s.action,
                protocol: s.protocol,
                description: s.description,
                asset: (s.asset as string) ?? (s.assetCode as string),
              })),
            }}
            simulationReport={{ xdrs: steps.map((s) => s.xdr as string).filter(Boolean) }}
          />
        );
      }
      return executeDispatchRender({
        ...props,
        result: data,
        args: {
          ...(props.args as Record<string, unknown>),
          protocol: data.protocol as string,
          action: data.action as string,
        },
      });
    },
  },
  {
    toolName: "flow_execution_update",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (!data) return <div className="text-muted-foreground text-xs">No execution data</div>;
      return (
        <ExecutionCard
          step={(data.step as number) ?? 0}
          totalSteps={(data.total_steps as number) ?? 1}
          status={((data.status as string) ?? "submitting") as TxStatus}
          txHash={data.tx_hash as string}
          description={data.description as string}
          error={data.error as string}
        />
      );
    },
  },
  {
    toolName: "flow_check_account_status",
    render: (props) => {
      const data = parseFlowResult(props.result);
      return <AccountSetupCard result={data ?? props.result} />;
    },
  },
];
