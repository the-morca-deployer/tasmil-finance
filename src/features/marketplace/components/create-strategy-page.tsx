"use client";

import { AlertCircle, Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import type { StrategyConfig, TemplateType } from "@/features/marketplace/types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6756";
const ORACLE_ADDRESS =
  process.env.NEXT_PUBLIC_ORACLE_ID ?? "CBTQ3YCTMDTT5YIPRBLOXX2E75VSJXTPTBPVUCQWAFLABLJEDTW7AVYE";
const FD_ADDRESS =
  process.env.NEXT_PUBLIC_FEE_DISTRIBUTOR_ID ??
  "CDLK6KQ6XMRT3L4BKTZAMSPDSRJNQ7EDAQTLY532GUI72253V6P6NKFZ";
const ROUTER_ADDRESS =
  process.env.NEXT_PUBLIC_SOROSWAP_ROUTER_ID ??
  "CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD";

const DEFAULT_CONFIG: StrategyConfig = {
  template: "blend",
  tokenIn: "XLM",
  tokenOut: "USDC",
  thresholdPrice: 0.15,
  swapPercentBps: 5000,
  perfFeeBps: 500,
  dexType: 0,
  strategyName: "My Strategy",
};

type Step = "form" | "deploying" | "done" | "error";

export function CreateStrategyPage() {
  const [step, setStep] = useState<Step>("form");
  const [config, setConfig] = useState<StrategyConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<any>(null);

  const handleConfigChange = (field: keyof StrategyConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeploy = async () => {
    setStep("deploying");
    setError(null);
    try {
      const token = localStorage.getItem("tasmil_auth_token") ?? "";
      const body = {
        template: config.template,
        name: config.strategyName,
        tokenInAddress: config.tokenIn?.startsWith("C")
          ? config.tokenIn
          : "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        tokenOutAddress: config.tokenOut?.startsWith("C")
          ? config.tokenOut
          : "CA2E53VHFZ6YSWQIEIPBXJQGT6VW3VKWWZO555XKRQXYJ63GEBJJGHY7",
        oracleAddress: ORACLE_ADDRESS,
        thresholdPrice: String(Math.round((config.thresholdPrice ?? 0) * 10_000_000)),
        swapPercentBps: config.swapPercentBps,
        perfFeeBps: config.perfFeeBps,
        platformFeeBps: 100,
        feeDistributorAddress: FD_ADDRESS,
        soroswapRouterAddress: ROUTER_ADDRESS,
        publisherWallet: "GBN2QI5IVRVEVQHPU54KY3XWGN4UL7VJ7TPBGTEKJM3V5U6W44AJ6VVU",
      };

      const res = await fetch(`${API_URL}/api/marketplace/strategies/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setDeployResult(json.data);
        setStep("done");
      } else {
        throw new Error(json.message || "Deploy failed");
      }
    } catch (e: any) {
      setError(e.message);
      setStep("error");
    }
  };

  if (step === "deploying") {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-white/40" />
        <p className="mt-6 text-lg font-semibold text-white">Deploying Strategy</p>
        <p className="mt-2 text-sm text-white/40">
          Compiling WASM &rarr; Deploying contract &rarr; Publishing to marketplace...
        </p>
      </div>
    );
  }

  if (step === "done" && deployResult) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <p className="mt-6 text-lg font-semibold text-white">Strategy Deployed!</p>
        <p className="mt-2 text-sm text-white/40">Contract: {deployResult.contractAddress}</p>
        <Button
          className="mt-8"
          onClick={() => (window.location.href = `/marketplace/${deployResult.strategyId}`)}
        >
          View Strategy
        </Button>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-6 text-lg font-semibold text-white">Deploy Failed</p>
        <p className="mt-2 text-sm text-red-400">{error}</p>
        <Button className="mt-8" variant="outline" onClick={() => setStep("form")}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Create Strategy</h1>
      <p className="mt-1 text-sm text-white/40">Configure your strategy and deploy</p>

      <div className="mt-8 space-y-4">
        <Card className="border-white/5 bg-white/3 p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Strategy Config</h2>
          <div className="space-y-4 text-sm">
            <ConfigField
              label="Strategy Name"
              value={config.strategyName}
              onChange={(v) => handleConfigChange("strategyName", v)}
            />
            <ConfigSelect
              label="Template"
              value={config.template}
              options={["swap", "dca"]}
              onChange={(v) => handleConfigChange("template", v as TemplateType)}
            />
            <ConfigField
              label="Token In (symbol or SAC address)"
              value={config.tokenIn}
              onChange={(v) => handleConfigChange("tokenIn", v)}
            />
            <ConfigField
              label="Token Out (symbol or SAC address)"
              value={config.tokenOut}
              onChange={(v) => handleConfigChange("tokenOut", v)}
            />
            <ConfigField
              label="Threshold Price (USD)"
              value={String(config.thresholdPrice ?? "")}
              onChange={(v) => handleConfigChange("thresholdPrice", Number(v) || 0)}
              type="number"
            />
            <ConfigField
              label="Swap Percent (1-100)"
              value={String(config.swapPercentBps / 100)}
              onChange={(v) => handleConfigChange("swapPercentBps", Number(v) * 100 || 5000)}
              type="number"
            />
            <ConfigField
              label="Performance Fee % (0-10)"
              value={String(config.perfFeeBps / 100)}
              onChange={(v) => handleConfigChange("perfFeeBps", Number(v) * 100 || 500)}
              type="number"
            />
            <ConfigSelect
              label="DEX"
              value={config.dexType === 0 ? "Soroswap" : "Aquarius"}
              options={["Soroswap", "Aquarius"]}
              onChange={(v) => handleConfigChange("dexType", v === "Aquarius" ? 1 : 0)}
            />
          </div>
        </Card>
        <Button className="w-full gap-2" onClick={handleDeploy}>
          <Sparkles className="h-4 w-4" /> Deploy Strategy
        </Button>
      </div>
    </div>
  );
}

function ConfigField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="min-w-[140px] text-white/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-right text-white transition-colors focus:border-white/20 focus:outline-none"
      />
    </div>
  );
}

function ConfigSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="min-w-[140px] text-white/50">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-right text-white transition-colors focus:border-white/20 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
