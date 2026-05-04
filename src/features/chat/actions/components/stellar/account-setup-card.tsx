"use client";

import { CheckCircle2, Circle, Loader2, Rocket, XCircle } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { BaseInfoCard } from "../base/info-card";

interface AccountSetupData {
  has_account?: boolean;
  hasAccount?: boolean;
  status?: string;
  preset?: string;
  next_step?: string;
  nextStep?: string;
  total_value_usd?: number;
  totalValueUsd?: number;
  current_apy?: number;
  currentApy?: number;
  message?: string;
  position_count?: number;
  error?: string;
}

interface AccountSetupCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

const STEPS = [
  { key: "deploy", label: "Deploy Smart Account", desc: "Create on-chain keeper wallet" },
  { key: "setup", label: "Configure Session Key", desc: "Authorize bot management" },
  { key: "fund", label: "Fund Account", desc: "Deposit USDC or XLM" },
  { key: "active", label: "Strategy Active", desc: "Auto-rebalancing live" },
];

type StepStatus = "pending" | "in-progress" | "done" | "error";

function getStepStatus(stepKey: string, nextStep: string): StepStatus {
  const stepOrder = ["deploy", "setup", "fund", "active"];
  const currentIdx = stepOrder.indexOf(nextStep);
  const stepIdx = stepOrder.indexOf(stepKey);

  if (currentIdx === -1) return "pending";
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "in-progress";
  return "pending";
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in-progress":
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case "error":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/40" />;
  }
}

function AccountSetupCardComponent({
  result,
  status,
}: AccountSetupCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<AccountSetupData>(
    result,
    status,
  );

  const hasAccount = data?.has_account ?? data?.hasAccount ?? false;
  const nextStep = (data?.next_step ?? data?.nextStep ?? "deploy").toLowerCase();
  const accountStatus = data?.status ?? "";
  const accountPreset = data?.preset ?? "";
  const totalValue = data?.total_value_usd ?? data?.totalValueUsd;

  // If no account, show setup steps
  if (!hasAccount && !isLoading) {
    return (
      <BaseInfoCard
        data-testid="card-account-setup"
        title="Setting Up Your Smart Account"
        subtitle="3 steps to start earning yield"
        icon={Rocket}
        iconColor="text-violet-500"
        iconBg="bg-violet-500/10"
        isLoading={isLoading}
        error={hasError ? errorMessage : null}
      >
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const stepStatus = getStepStatus(step.key, nextStep);
            const isLast = idx === STEPS.length - 1;

            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepIcon status={stepStatus} />
                  {!isLast && (
                    <div
                      className={`mt-1 w-px flex-1 ${
                        stepStatus === "done"
                          ? "bg-green-500/30"
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-3 ${stepStatus === "in-progress" ? "" : "opacity-60"}`}>
                  <div className="font-medium text-sm">
                    {idx + 1}. {step.label}
                  </div>
                  <div className="text-muted-foreground text-xs">{step.desc}</div>
                  {stepStatus === "in-progress" && (
                    <div className="mt-1 font-medium text-primary text-xs animate-pulse">
                      Waiting for confirmation...
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {data?.message && (
            <div className="rounded bg-muted/30 p-2 text-muted-foreground text-xs">
              {data.message}
            </div>
          )}
        </div>
      </BaseInfoCard>
    );
  }

  // Has account — show current status
  return (
    <BaseInfoCard
      title="Your Smart Account"
      subtitle={
        totalValue != null
          ? `$${totalValue.toLocaleString()} · ${accountPreset}`
          : `${accountStatus} · ${accountPreset}`
      }
      icon={Rocket}
      iconColor="text-green-500"
      iconBg="bg-green-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">{accountStatus || "Unknown"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Preset</span>
          <span className="font-medium">{accountPreset || "BALANCED"}</span>
        </div>
        {totalValue != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-medium">${totalValue.toLocaleString()}</span>
          </div>
        )}
        {data?.current_apy != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current APY</span>
            <span className="font-medium text-green-500">
              {data.current_apy.toFixed(1)}%
            </span>
          </div>
        )}
        {data?.message && (
          <div className="rounded bg-muted/30 p-2 text-muted-foreground text-xs">
            {data.message}
          </div>
        )}
      </div>
    </BaseInfoCard>
  );
}

export const AccountSetupCard = memo(AccountSetupCardComponent);
