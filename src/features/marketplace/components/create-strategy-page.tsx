"use client";

import { AlertCircle, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
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

type Step = "prompt" | "review" | "deploying" | "done" | "error";

export function CreateStrategyPage() {
  const [step, setStep] = useState<Step>("prompt");
  const [prompt, setPrompt] = useState("");
  const [config, setConfig] = useState<StrategyConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<any>(null);

  const handleParsePrompt = async () => {
    if (!prompt.trim()) return;
    setStep("review");
    // AI parses prompt → structured config
    // For MVP: simulate AI parsing with hardcoded defaults
    setConfig({
      template: "swap",
      tokenIn: "XLM",
      tokenOut: "USDC",
      thresholdPrice: 0.15,
      swapPercentBps: 5000,
      perfFeeBps: 500,
      dexType: 0,
      strategyName: prompt.split(" ").slice(0, 3).join(" ") || "My Strategy",
    });
  };

  const handleConfigChange = (field: keyof StrategyConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const handleDeploy = async () => {
    if (!config) return;
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
          : "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5",
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
          Compiling WASM → Deploying contract → Publishing to marketplace...
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
        <Button className="mt-8" variant="outline" onClick={() => setStep("prompt")}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Create Strategy</h1>
      <p className="mt-1 text-sm text-white/40">Describe your trading strategy in plain English</p>

      {/* Step 1: Prompt input */}
      {step === "prompt" && (
        <div className="mt-8 space-y-4">
          <Card className="border-white/5 bg-white/3 p-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g. "Swap 50% of my XLM to USDC when the price exceeds $0.50, with a 5% performance fee"`}
              className="min-h-[140px] w-full resize-none rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
              <Sparkles className="h-3.5 w-3.5" />
              AI will extract: template, tokens, threshold, swap percent, fees
            </div>
          </Card>
          <Button className="w-full gap-2" onClick={handleParsePrompt} disabled={!prompt.trim()}>
            Parse & Review <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Review config */}
      {step === "review" && config && (
        <div className="mt-8 space-y-4">
          <Card className="border-white/5 bg-white/3 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Review Strategy Config</h2>
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
          <Button variant="outline" className="w-full" onClick={() => setStep("prompt")}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Inline form fields ──────────────────────────────────────────────────────

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
