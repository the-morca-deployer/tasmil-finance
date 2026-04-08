"use client";

import {
  Brain,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  SkipForward,
  ArrowRightLeft,
  Wallet,
  TrendingUp,
  Search,
  Info,
  Repeat,
  Landmark,
} from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface PlanStepData {
  step: number;
  agent: string;
  action: string;
  needs_confirm: boolean;
  status: string; // pending | running | completed | failed | skipped
}

interface SupervisorPlanCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result?: any;
  toolCallId?: string;
  status?: string;
  // Direct props from push_ui_message
  intent?: string;
  reasoning?: string;
  steps?: PlanStepData[];
  currentStep?: number;
  error?: string;
}

const AGENT_CONFIG: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  bridge: { icon: ArrowRightLeft, color: "text-purple-500", label: "Bridge" },
  vault: { icon: Wallet, color: "text-blue-500", label: "Vault" },
  yield: { icon: TrendingUp, color: "text-green-500", label: "Yield" },
  swap: { icon: Repeat, color: "text-orange-500", label: "Swap" },
  staking: { icon: Landmark, color: "text-cyan-500", label: "Staking" },
  research: { icon: Search, color: "text-yellow-500", label: "Research" },
  info: { icon: Info, color: "text-gray-500", label: "Info" },
};

function getStatusIcon(status: string, isCurrentStep: boolean) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "skipped":
      return <SkipForward className="h-4 w-4 text-gray-400" />;
    case "pending":
    default:
      return isCurrentStep ? (
        <Circle className="h-4 w-4 text-blue-400" />
      ) : (
        <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
      );
  }
}

function SupervisorPlanCardComponent(props: SupervisorPlanCardProps) {
  // Props can come directly or via result
  const steps: PlanStepData[] = props.steps || props.result?.steps || [];
  const reasoning = props.reasoning || props.result?.reasoning || "";
  const currentStep = props.currentStep ?? props.result?.currentStep ?? 0;

  if (!steps.length) return null;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allDone = completedCount === steps.length;
  const hasFailed = steps.some((s) => s.status === "failed");

  return (
    <div className="w-fit min-w-[320px] max-w-[420px] rounded-lg border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
          <Brain className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm font-semibold">
            {allDone ? "Plan Completed" : hasFailed ? "Plan (with errors)" : "Execution Plan"}
          </h3>
          <p className="text-muted-foreground text-xs">
            {allDone
              ? `All ${steps.length} steps completed`
              : `Step ${Math.min(currentStep + 1, steps.length)} of ${steps.length}`}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="mb-3 rounded-md bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground italic">{reasoning}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            hasFailed ? "bg-red-500" : "bg-green-500",
          )}
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-0.5">
        {steps.map((step, idx) => {
          const isCurrentStep = idx === currentStep && !allDone;
          const config = AGENT_CONFIG[step.agent] || AGENT_CONFIG["info"]!;
          const AgentIcon = config.icon;

          return (
            <div
              key={`step-${step.step}-${idx}`}
              className={cn(
                "flex items-start gap-3 rounded-md px-3 py-2 transition-colors",
                isCurrentStep && "bg-blue-500/5 border border-blue-500/20",
                step.status === "completed" && "opacity-70",
                step.status === "skipped" && "opacity-40",
              )}
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">{getStatusIcon(step.status, isCurrentStep)}</div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AgentIcon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                  <span className="text-xs font-semibold">{config.label}</span>
                  {step.needs_confirm && step.status === "pending" && (
                    <span className="text-[10px] rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5">
                      approval needed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.action}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SupervisorPlanCard = memo(SupervisorPlanCardComponent);
