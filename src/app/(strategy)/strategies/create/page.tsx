"use client";

import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RequireVaultGuard } from "@/features/marketplace/components/require-vault-guard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6756";

const STEPS = [
  { step: 1, label: "Identity" },
  { step: 2, label: "Details" },
  { step: 3, label: "Review" },
  { step: 4, label: "Deploy" },
];

const ASSETS = ["XLM", "USDC", "ETH", "SOL", "ARB"];
const RISK_TIERS = ["Conservative", "Balanced", "Aggressive"];

interface PoolAllocation {
  name: string;
  protocol: string;
  percent: number;
}

interface FormData {
  publisherName: string;
  bio: string;
  website: string;
  twitter: string;
  strategyName: string;
  description: string;
  baseAsset: string;
  riskTier: string;
  perfFee: string;
  driftThreshold: string;
  allocations: PoolAllocation[];
  tags: string[];
}

const DEFAULT_ALLOCATIONS: PoolAllocation[] = [
  { name: "XLM / USDC", protocol: "Soroswap", percent: 40 },
  { name: "XLM Staking", protocol: "Stellar", percent: 25 },
  { name: "Aquarius LP", protocol: "Aquarius", percent: 20 },
  { name: "Reserve", protocol: "USDC", percent: 15 },
];

const DEFAULT_FORM: FormData = {
  publisherName: "",
  bio: "",
  website: "",
  twitter: "",
  strategyName: "",
  description: "",
  baseAsset: "XLM",
  riskTier: "Balanced",
  perfFee: "2.0",
  driftThreshold: "50",
  allocations: DEFAULT_ALLOCATIONS,
  tags: [],
};

type DeployState =
  | { status: "idle" }
  | { status: "deploying" }
  | { status: "done"; txHash?: string }
  | { status: "error"; error: string };

function PublishStrategyContent() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState("");
  const [deploy, setDeploy] = useState<DeployState>({ status: "idle" });
  const [publishStep, setPublishStep] = useState<"sign" | "confirm" | "done" | null>(null);
  const [deployResult, setDeployResult] = useState<{
    contractAddress: string;
    strategyId: string;
    unsignedPublishXdr: string;
  } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const update = (field: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addTag = () => {
    const val = tagInput.trim();
    if (!val || form.tags.includes(val)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, val] }));
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  const setAllocation = (index: number, percent: number) =>
    setForm((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a, i) => (i === index ? { ...a, percent } : a)),
    }));

  const totalAllocation = form.allocations.reduce((sum, a) => sum + a.percent, 0);

  const handleDeploy = async () => {
    setDeploy({ status: "deploying" });
    try {
      const token = localStorage.getItem("tasmil_auth_token") ?? "";
      const res = await fetch(`${API_URL}/api/marketplace/strategies/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          template: "swap",
          name: form.strategyName,
          tokenInAddress: form.baseAsset,
          tokenOutAddress: "USDC",
          oracleAddress: process.env.NEXT_PUBLIC_ORACLE_ID ?? "",
          thresholdPrice: "1500000",
          swapPercentBps: 5000,
          perfFeeBps: Math.round(Number.parseFloat(form.perfFee) * 100),
          platformFeeBps: 100,
          feeDistributorAddress: process.env.NEXT_PUBLIC_FEE_DISTRIBUTOR_ID ?? "",
          soroswapRouterAddress: process.env.NEXT_PUBLIC_SOROSWAP_ROUTER_ID ?? "",
        }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        if (data?.unsignedPublishXdr) {
          setDeployResult({
            contractAddress: data.contractAddress,
            strategyId: data.strategyId,
            unsignedPublishXdr: data.unsignedPublishXdr,
          });
          setDeploy({ status: "done" });
          setPublishStep("sign");
        } else {
          setDeploy({
            status: "done",
            txHash: data?.contractAddress ?? data?.strategyId,
          });
        }
      } else {
        throw new Error(json.message || "Deploy failed");
      }
    } catch (e: unknown) {
      setDeploy({ status: "error", error: (e as Error).message });
    }
  };

  const handleConfirmPublish = async (txHash: string) => {
    if (!deployResult) return;
    setPublishStep("confirm");
    setConfirmError(null);
    try {
      const token = localStorage.getItem("tasmil_auth_token") ?? "";
      const res = await fetch(`${API_URL}/api/marketplace/strategies/build/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ txHash, contractAddress: deployResult.contractAddress }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to confirm publish");
      setPublishStep("done");
    } catch (e: unknown) {
      setConfirmError((e as Error).message);
      setPublishStep("sign");
    }
  };

  const canProceedStep1 = form.publisherName.trim() && form.bio.trim();
  const canProceedStep2 =
    form.strategyName.trim() && form.description.trim() && totalAllocation === 100;

  // ---- Deploy states ----
  if (deploy.status === "deploying") {
    return (
      <div className="mx-auto max-w-[800px] px-[clamp(20px,5vw,72px)] py-24 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-white/40" />
        <p className="mt-6 text-lg font-semibold text-[#F4F7FB]">Deploying Strategy</p>
        <p className="mt-2 text-sm text-[rgba(244,247,251,0.58)]">
          Compiling WASM → Deploying contract → Publishing to marketplace...
        </p>
      </div>
    );
  }

  if (deploy.status === "done") {
    // ---- Publish signing flow (new API with unsignedPublishXdr) ----
    if (publishStep === "sign" && deployResult) {
      return (
        <div className="mx-auto max-w-[800px] px-[clamp(20px,5vw,72px)] py-24 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-2xl text-[#04141A]">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="text-[clamp(18px,2vw,24px)] font-bold tracking-[-0.03em] text-[#F4F7FB]">
            Contract Deployed
          </h3>
          <p className="mx-auto mt-2 max-w-[440px] text-[14px] leading-[1.55] text-[rgba(244,247,251,0.58)]">
            Your strategy contract has been deployed. Sign the publish transaction in your wallet to
            make it live on the marketplace.
          </p>
          {deployResult.contractAddress && (
            <p className="mt-4 font-mono text-[13px] text-[#67E8F9]">
              Contract: {deployResult.contractAddress}
            </p>
          )}
          {confirmError && <p className="mt-4 text-[14px] text-red-400">{confirmError}</p>}
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[26px] py-3.5 text-[15px] font-semibold text-[#F4F7FB] backdrop-blur-[8px] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:border-[#67E8F9]"
              onClick={() => {
                setDeploy({ status: "idle" });
                setPublishStep(null);
                setDeployResult(null);
                setConfirmError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[26px] py-3.5 text-[15px] font-semibold text-[#04141A] transition-all duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]"
              onClick={() => {
                const txHash = window.prompt("Enter signed transaction hash:");
                if (txHash) {
                  handleConfirmPublish(txHash);
                }
              }}
            >
              I&apos;ve Signed &mdash; Submit
            </button>
          </div>
        </div>
      );
    }

    // ---- Confirming publish ----
    if (publishStep === "confirm") {
      return (
        <div className="mx-auto max-w-[800px] px-[clamp(20px,5vw,72px)] py-24 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-white/40" />
          <p className="mt-6 text-lg font-semibold text-[#F4F7FB]">Confirming Publish</p>
          <p className="mt-2 text-sm text-[rgba(244,247,251,0.58)]">
            Submitting signed transaction to the marketplace...
          </p>
        </div>
      );
    }

    // ---- Publish complete ----
    if (publishStep === "done" && deployResult) {
      return (
        <div className="mx-auto max-w-[800px] px-[clamp(20px,5vw,72px)] py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-2xl text-[#04141A]">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-[24px] font-bold text-[#F4F7FB]">Published Successfully</h3>
          <p className="mt-2 text-[15px] text-[rgba(244,247,251,0.58)]">
            {form.strategyName} is now live on the marketplace.
          </p>
          {deployResult.contractAddress && (
            <p className="mt-4 font-mono text-[13px] text-[#67E8F9]">
              Contract: {deployResult.contractAddress}
            </p>
          )}
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/strategies/dashboard"
              className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[26px] py-3.5 text-[15px] font-semibold text-[#F4F7FB] transition-transform duration-[400ms] hover:translate-y-[-2px]"
            >
              View Dashboard
            </Link>
            <Link
              href={`/strategies/${deployResult.strategyId}`}
              className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[26px] py-3.5 text-[15px] font-semibold text-[#04141A] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]"
            >
              View Strategy →
            </Link>
          </div>
        </div>
      );
    }

    // ---- Old API flow (no unsignedPublishXdr) ----
    return (
      <div className="mx-auto max-w-[800px] px-[clamp(20px,5vw,72px)] py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-2xl text-[#04141A]">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-[24px] font-bold text-[#F4F7FB]">Published Successfully</h3>
        <p className="mt-2 text-[15px] text-[rgba(244,247,251,0.58)]">
          {form.strategyName} is now live on the marketplace.
        </p>
        {deploy.txHash && (
          <p className="mt-4 font-mono text-[13px] text-[#67E8F9]">Contract: {deploy.txHash}</p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/strategies/dashboard"
            className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[26px] py-3.5 text-[15px] font-semibold text-[#F4F7FB] transition-transform duration-[400ms] hover:translate-y-[-2px]"
          >
            View Dashboard
          </Link>
          <Link
            href="/strategies"
            className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[26px] py-3.5 text-[15px] font-semibold text-[#04141A] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]"
          >
            Browse Marketplace →
          </Link>
        </div>
      </div>
    );
  }

  if (deploy.status === "error") {
    return (
      <div className="mx-auto max-w-[800px] px-[clamp(20px,5vw,72px)] py-24 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-6 text-lg font-semibold text-[#F4F7FB]">Deploy Failed</p>
        <p className="mt-2 text-sm text-red-400">{deploy.error}</p>
        <button
          type="button"
          className="mt-8 inline-flex items-center gap-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[26px] py-3.5 text-[15px] font-semibold text-[#F4F7FB] transition-transform duration-[400ms] hover:translate-y-[-2px]"
          onClick={() => setDeploy({ status: "idle" })}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ---- Form ----
  return (
    <div className="mx-auto max-w-[800px] px-[clamp(20px,5vw,72px)]">
      {/* Page header */}
      <div className="pb-2 pt-11">
        <span className="mb-2.5 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#67E8F9] before:block before:h-px before:w-[26px] before:bg-[#67E8F9]/60">
          Publisher Tools
        </span>
        <h1 className="text-[clamp(28px,4vw,42px)] font-extrabold leading-[0.97] tracking-[-0.04em] text-[#F4F7FB]">
          Publish{" "}
          <span className="bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text text-transparent">
            Strategy
          </span>
        </h1>
      </div>

      {/* Step indicator */}
      <div className="relative mb-10 flex gap-0">
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-[rgba(255,255,255,0.08)]" />
        {STEPS.map((s) => {
          const isActive = s.step === step;
          const isDone = s.step < step;
          return (
            <div key={s.step} className="relative z-[1] flex-1 text-center">
              <span
                className={`mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-[14px] font-bold transition-all duration-[400ms] ${
                  isActive
                    ? "border-transparent bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-[#04141A] shadow-[0_0_20px_-4px_rgba(103,232,249,0.5)]"
                    : isDone
                      ? "border-[#67E8F9] bg-[rgba(103,232,249,0.14)] text-[#67E8F9]"
                      : "border-[rgba(255,255,255,0.14)] bg-[#0D111A] text-[rgba(244,247,251,0.34)]"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.step}
              </span>
              <div
                className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${
                  isActive
                    ? "text-[#67E8F9]"
                    : isDone
                      ? "text-[rgba(244,247,251,0.58)]"
                      : "text-[rgba(244,247,251,0.34)]"
                }`}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Identity */}
      {step === 1 && (
        <div className="mb-10 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-9 max-sm:p-6">
          <h3 className="text-[clamp(18px,2vw,24px)] font-bold tracking-[-0.03em] text-[#F4F7FB]">
            Publisher Identity
          </h3>
          <p className="mb-7 text-[14px] leading-[1.55] text-[rgba(244,247,251,0.58)]">
            Set your publisher name, bio, and links. This will be visible on every strategy you
            publish.
          </p>

          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
              Publisher name <span className="ml-0.5 text-[#67E8F9]">*</span>
            </label>
            <input
              className="w-full rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-[18px] py-[13px] text-[15px] text-[#F4F7FB] outline-none transition-colors placeholder:text-[rgba(244,247,251,0.34)] focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
              placeholder="e.g. Arden Research"
              value={form.publisherName}
              onChange={(e) => update("publisherName", e.target.value)}
            />
          </div>

          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
              Bio <span className="ml-0.5 text-[#67E8F9]">*</span>
            </label>
            <textarea
              className="min-h-[100px] w-full resize-y rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-4 py-[13px] text-[15px] leading-[1.55] text-[#F4F7FB] outline-none transition-colors placeholder:text-[rgba(244,247,251,0.34)] focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
              placeholder="Describe your background, strategy philosophy, and track record..."
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
            />
          </div>

          <div className="mb-[22px] grid grid-cols-2 gap-[18px] max-sm:grid-cols-1">
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
                Website
              </label>
              <input
                className="w-full rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-[18px] py-[13px] text-[15px] text-[#F4F7FB] outline-none transition-colors placeholder:text-[rgba(244,247,251,0.34)] focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
                placeholder="https://"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
                Twitter / X
              </label>
              <input
                className="w-full rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-[18px] py-[13px] text-[15px] text-[#F4F7FB] outline-none transition-colors placeholder:text-[rgba(244,247,251,0.34)] focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
                placeholder="@handle"
                value={form.twitter}
                onChange={(e) => update("twitter", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end border-t border-[rgba(255,255,255,0.08)] pt-6">
            <button
              type="button"
              disabled={!canProceedStep1}
              className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[26px] py-3.5 text-[15px] font-semibold text-[#04141A] transition-all duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setStep(2)}
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Strategy Details */}
      {step === 2 && (
        <div className="mb-10 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-9 max-sm:p-6">
          <h3 className="text-[clamp(18px,2vw,24px)] font-bold tracking-[-0.03em] text-[#F4F7FB]">
            Strategy Details
          </h3>
          <p className="mb-7 text-[14px] leading-[1.55] text-[rgba(244,247,251,0.58)]">
            Define the strategy metadata and allocate capital across pools.
          </p>

          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
              Strategy name <span className="ml-0.5 text-[#67E8F9]">*</span>
            </label>
            <input
              className="w-full rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-[18px] py-[13px] text-[15px] text-[#F4F7FB] outline-none transition-colors placeholder:text-[rgba(244,247,251,0.34)] focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
              placeholder="e.g. XLM Trend Rider"
              value={form.strategyName}
              onChange={(e) => update("strategyName", e.target.value)}
            />
          </div>

          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
              Description <span className="ml-0.5 text-[#67E8F9]">*</span>
            </label>
            <textarea
              className="min-h-[100px] w-full resize-y rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-4 py-[13px] text-[15px] leading-[1.55] text-[#F4F7FB] outline-none transition-colors placeholder:text-[rgba(244,247,251,0.34)] focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
              placeholder="Describe the strategy logic, risk parameters, and target audience..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="mb-[22px] grid grid-cols-2 gap-[18px] max-sm:grid-cols-1">
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
                Base asset <span className="ml-0.5 text-[#67E8F9]">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full cursor-pointer appearance-none rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] py-[13px] pl-[18px] pr-[42px] text-[15px] font-medium text-[#F4F7FB] outline-none transition-colors hover:border-[#67E8F9] focus:border-[#67E8F9]"
                  value={form.baseAsset}
                  onChange={(e) => update("baseAsset", e.target.value)}
                >
                  {ASSETS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 block h-2 w-2 -translate-y-[70%] rotate-45 border-r-[1.6px] border-b-[1.6px] border-[#67E8F9]" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
                Risk tier <span className="ml-0.5 text-[#67E8F9]">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full cursor-pointer appearance-none rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] py-[13px] pl-[18px] pr-[42px] text-[15px] font-medium text-[#F4F7FB] outline-none transition-colors hover:border-[#67E8F9] focus:border-[#67E8F9]"
                  value={form.riskTier}
                  onChange={(e) => update("riskTier", e.target.value)}
                >
                  {RISK_TIERS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 block h-2 w-2 -translate-y-[70%] rotate-45 border-r-[1.6px] border-b-[1.6px] border-[#67E8F9]" />
              </div>
            </div>
          </div>

          <div className="mb-[22px] grid grid-cols-2 gap-[18px] max-sm:grid-cols-1">
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
                Perf. fee (%) <span className="ml-0.5 text-[#67E8F9]">*</span>
              </label>
              <input
                className="w-full rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-[18px] py-[13px] text-[15px] text-[#F4F7FB] outline-none transition-colors focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
                value={form.perfFee}
                onChange={(e) => update("perfFee", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
                Drift threshold (bps)
              </label>
              <input
                className="w-full rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-[18px] py-[13px] text-[15px] text-[#F4F7FB] outline-none transition-colors focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]"
                value={form.driftThreshold}
                onChange={(e) => update("driftThreshold", e.target.value)}
              />
              <div className="mt-1.5 text-[12px] text-[rgba(244,247,251,0.34)]">
                Rebalance trigger deviation
              </div>
            </div>
          </div>

          {/* Pool allocations */}
          <div className="mt-7 mb-5 border-t border-[rgba(255,255,255,0.08)] pt-6">
            <div className="mb-4 text-[15px] font-bold text-[#F4F7FB]">Pool allocations</div>
            {form.allocations.map((alloc, i) => (
              <div
                key={alloc.name}
                className="mb-4 flex items-center gap-4 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#07090F] px-[18px] py-3.5"
              >
                <span className="min-w-[100px] text-[14px] font-semibold text-[#F4F7FB]">
                  {alloc.name}
                </span>
                <span className="min-w-[60px] text-[12px] text-[rgba(244,247,251,0.34)]">
                  {alloc.protocol}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={alloc.percent}
                  onChange={(e) => setAllocation(i, Number(e.target.value))}
                  className="h-[5px] flex-1 appearance-none rounded-[100px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] outline-none [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#04141A] [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-white [&::-webkit-slider-thumb]:via-[#67E8F9] [&::-webkit-slider-thumb]:to-[#0EA5E9] [&::-webkit-slider-thumb]:shadow-[0_0_14px_-2px_rgba(103,232,249,0.5)]"
                />
                <span className="min-w-[40px] text-right font-mono font-semibold text-[#67E8F9]">
                  {alloc.percent}%
                </span>
              </div>
            ))}
            <div className="mt-2 text-right text-[13px]">
              Total:{" "}
              <span className={totalAllocation === 100 ? "text-[#6EE7B7]" : "text-[#FBBF24]"}>
                {totalAllocation}%
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[rgba(244,247,251,0.58)]">
              Tags
            </label>
            <div className="mb-2.5 flex gap-2.5">
              <input
                className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[#07090F] px-[18px] py-[13px] text-[15px] text-[#F4F7FB] outline-none transition-colors placeholder:text-[rgba(244,247,251,0.34)] focus:border-[#67E8F9]"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[12px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-[18px] font-bold text-[#04141A]"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(103,232,249,0.32)] bg-[rgba(103,232,249,0.14)] py-1.5 pl-3.5 pr-2 text-[13px] font-medium text-[#67E8F9]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-[12px] transition-colors hover:bg-[rgba(255,255,255,0.14)] hover:text-[#F4F7FB]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[26px] py-3.5 text-[15px] font-semibold text-[#F4F7FB] backdrop-blur-[8px] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:border-[#67E8F9]"
              onClick={() => setStep(1)}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              disabled={!canProceedStep2}
              className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[26px] py-3.5 text-[15px] font-semibold text-[#04141A] transition-all duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setStep(3)}
            >
              Review <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="mb-10 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-9 max-sm:p-6">
          <h3 className="text-[clamp(18px,2vw,24px)] font-bold tracking-[-0.03em] text-[#F4F7FB]">
            Review Strategy
          </h3>
          <p className="mb-7 text-[14px] leading-[1.55] text-[rgba(244,247,251,0.58)]">
            Double-check every field before submitting the transaction.
          </p>

          <div className="border-b border-[rgba(255,255,255,0.08)] py-[18px]">
            <div className="mb-1.5 text-[13px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
              Publisher
            </div>
            <div className="text-[16px] font-semibold text-[#F4F7FB]">{form.publisherName}</div>
          </div>
          <div className="border-b border-[rgba(255,255,255,0.08)] py-[18px]">
            <div className="mb-1.5 text-[13px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
              Strategy
            </div>
            <div className="text-[16px] font-semibold text-[#F4F7FB]">{form.strategyName}</div>
            <div className="mt-1 text-[13px] text-[rgba(244,247,251,0.58)]">{form.description}</div>
          </div>
          <div className="border-b border-[rgba(255,255,255,0.08)] py-[18px]">
            <div className="flex justify-between py-2.5">
              <span className="text-[14px] text-[rgba(244,247,251,0.58)]">Base asset</span>
              <span className="text-[14px] font-semibold text-[#F4F7FB]">{form.baseAsset}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[14px] text-[rgba(244,247,251,0.58)]">Risk tier</span>
              <span className="text-[14px] font-semibold text-[#FBBF24]">{form.riskTier}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[14px] text-[rgba(244,247,251,0.58)]">Performance fee</span>
              <span className="font-mono text-[14px] font-semibold text-[#F4F7FB]">
                {form.perfFee}%
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[14px] text-[rgba(244,247,251,0.58)]">Drift threshold</span>
              <span className="font-mono text-[14px] font-semibold text-[#F4F7FB]">
                {form.driftThreshold} bps
              </span>
            </div>
          </div>
          <div className="border-b border-[rgba(255,255,255,0.08)] py-[18px]">
            <div className="mb-3 text-[13px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
              Allocations
            </div>
            {form.allocations.map((a) => (
              <div key={a.name} className="flex justify-between py-2.5">
                <span className="text-[14px] text-[rgba(244,247,251,0.58)]">
                  {a.name} · {a.protocol}
                </span>
                <span className="font-mono text-[14px] font-semibold text-[#F4F7FB]">
                  {a.percent}%
                </span>
              </div>
            ))}
          </div>
          {form.tags.length > 0 && (
            <div className="py-[18px]">
              <div className="mb-3 text-[13px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-[100px] border border-[rgba(34,211,238,0.5)] bg-[rgba(103,232,249,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#67E8F9]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[26px] py-3.5 text-[15px] font-semibold text-[#F4F7FB] backdrop-blur-[8px] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:border-[#67E8F9]"
              onClick={() => setStep(2)}
            >
              <ChevronLeft className="h-4 w-4" /> Edit
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[26px] py-3.5 text-[15px] font-semibold text-[#04141A] transition-all duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]"
              onClick={() => setStep(4)}
            >
              Sign & Publish <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Sign */}
      {step === 4 && (
        <div className="mb-10 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-9 text-center max-sm:p-6">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-2xl text-[#04141A]">
            ✦
          </div>
          <h3 className="text-[clamp(18px,2vw,24px)] font-bold tracking-[-0.03em] text-[#F4F7FB]">
            Sign Transaction
          </h3>
          <p className="mx-auto mb-7 max-w-[440px] text-[14px] leading-[1.55] text-[rgba(244,247,251,0.58)]">
            Your wallet will open to confirm the deploy transaction. This action publishes your
            strategy to the Tasmil Marketplace.
          </p>

          <div className="mx-auto mb-7 max-w-[440px] rounded-[14px] border border-[rgba(103,232,249,0.32)] bg-[rgba(103,232,249,0.14)] p-5 text-left">
            <div className="flex justify-between py-2.5">
              <span className="text-[14px] text-[rgba(244,247,251,0.58)]">Network</span>
              <span className="text-[14px] font-semibold text-[#F4F7FB]">Stellar Mainnet</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[14px] text-[rgba(244,247,251,0.58)]">Base asset</span>
              <span className="text-[14px] font-semibold text-[#F4F7FB]">{form.baseAsset}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[14px] text-[rgba(244,247,251,0.58)]">Strategy name</span>
              <span className="text-[14px] font-semibold text-[#F4F7FB]">{form.strategyName}</span>
            </div>
            <div className="flex justify-between border-t border-[rgba(103,232,249,0.32)] py-2.5 pt-3">
              <span className="text-[14px] font-bold text-[rgba(244,247,251,0.58)]">Publisher</span>
              <span className="font-mono text-[13px] text-[#67E8F9]">{form.publisherName}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[26px] py-3.5 text-[15px] font-semibold text-[#F4F7FB] backdrop-blur-[8px] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:border-[#67E8F9]"
              onClick={() => setStep(3)}
            >
              <ChevronLeft className="h-4 w-4" /> Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[34px] py-3.5 text-[17px] font-semibold text-[#04141A] transition-all duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]"
              onClick={handleDeploy}
            >
              Confirm & Publish <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublishStrategyPage() {
  return (
    <RequireVaultGuard>
      <PublishStrategyContent />
    </RequireVaultGuard>
  );
}
