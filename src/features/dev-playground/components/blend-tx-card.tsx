"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Fuel, Loader2 } from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import { useWallet } from "@/shared/context/wallet-context";
import { checkWalletNetwork } from "@/lib/stellar-network-check";

// ─── Symbol resolution from contract address ────────────────────

const KNOWN_SYMBOLS: Record<string, string> = {
  CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC: "XLM",
  CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU: "USDC",
  CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA: "USDC",
  CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5: "USDC",
  CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN: "USDT",
  CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF: "BLND",
  CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE: "WETH",
  CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI: "WBTC",
  CC72F57YTPX76HAA64JQOEGHQAPSADQWSY5DWVBR66JINPFDLNCQYHIC: "CETES",
  CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE: "AQUA",
};

function resolveSymbol(contract: string): string {
  return KNOWN_SYMBOLS[contract] ?? (contract.length > 10 ? `${contract.slice(0, 6)}…` : contract);
}

function fmtAmount(stroops: string | number, decimals = 7): string {
  const n = Number(stroops) / 10 ** decimals;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(decimals > 4 ? 4 : decimals);
}

function fmtGas(stroops: string | number): string {
  return `${(Number(stroops) / 1e7).toFixed(7)} XLM`;
}

function trunc(s: string): string {
  return s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;
}

// ─── Operation labels ───────────────────────────────────────────

const OP_CONFIG: Record<string, { label: string; verb: string; action: string }> = {
  blend_supply:             { label: "Supply",       verb: "to supply",      action: "Sign & Supply" },
  blend_borrow:             { label: "Borrow",       verb: "to borrow",      action: "Sign & Borrow" },
  blend_repay:              { label: "Repay",         verb: "to repay",       action: "Sign & Repay" },
  blend_withdraw:           { label: "Withdraw",      verb: "to withdraw",    action: "Sign & Withdraw" },
  blend_toggle_collateral:  { label: "Toggle Collateral", verb: "",           action: "Sign & Toggle" },
  blend_claim:              { label: "Claim Emissions", verb: "to claim",     action: "Sign & Claim" },
  backstop_deposit:         { label: "Backstop Deposit", verb: "to deposit",  action: "Sign & Deposit" },
  backstop_queue:           { label: "Queue Withdrawal", verb: "to queue",    action: "Sign & Queue" },
  backstop_dequeue:         { label: "Dequeue",         verb: "to dequeue",   action: "Sign & Dequeue" },
  backstop_withdraw:        { label: "Backstop Withdraw", verb: "to withdraw", action: "Sign & Withdraw" },
};

// ─── Types ──────────────────────────────────────────────────────

interface BlendTxCardProps {
  operation: string;
  result: Record<string, unknown>;
  form: Record<string, string>;
}

interface AssetPos { symbol: string; amount: number; apy: number }
interface PositionData {
  hasPosition: boolean;
  // SDK format
  collateral?: AssetPos[];
  supply?: AssetPos[];
  liabilities?: AssetPos[];
  // MCP format (flat)
  positions?: { symbol: string; suppliedAmount?: string; borrowedAmount?: string; isCollateral?: boolean }[];
  summary?: {
    totalSuppliedUsd: number | null;
    totalBorrowedUsd: number | null;
    borrowCapacityUsd: number | null;
    borrowLimitRatio: number | null;
  };
}

// ─── Component ──────────────────────────────────────────────────

export function BlendTxCard({ operation, result, form }: BlendTxCardProps) {
  const { signTransaction } = useWallet();
  const [positions, setPositions] = useState<PositionData | null>(null);
  const [signing, setSigning] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [showXdr, setShowXdr] = useState(false);

  const cfg = OP_CONFIG[operation] ?? { label: operation, verb: "", action: "Sign" };
  const symbol = resolveSymbol(String(form.asset ?? result.asset ?? ""));
  const amount = String(form.amount ?? result.amount ?? "0");
  const fee = String(result.estimatedFee ?? "0");
  const xdr = String(result.xdr ?? "");
  const pool = String(form.pool ?? result.pool ?? "");
  const from = String(form.from ?? result.from ?? "");

  // Fetch current positions to show before/after
  useEffect(() => {
    if (!pool || !from) return;
    fetch(`/api/blend/positions?pool=${pool}&user=${from}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPositions(d as PositionData);
      })
      .catch(() => {});
  }, [pool, from]);

  // Find current amount for this asset
  const currentForAsset = useCallback(() => {
    if (!positions) return null;
    const assetContract = String(form.asset ?? result.asset ?? "");
    const sym = resolveSymbol(assetContract);

    // Handle MCP flat positions format
    if (positions.positions?.length) {
      if (operation === "blend_borrow" || operation === "blend_repay") {
        const p = positions.positions.find((x) => x.symbol === sym && x.borrowedAmount != null);
        return p ? Number(p.borrowedAmount) : 0;
      }
      const p = positions.positions.find((x) => x.symbol === sym && x.suppliedAmount != null);
      return p ? Number(p.suppliedAmount) : 0;
    }

    // Handle SDK separate arrays format
    const col = positions.collateral ?? [];
    const sup = positions.supply ?? [];
    const lia = positions.liabilities ?? [];

    if (operation === "blend_borrow" || operation === "blend_repay") {
      const found = lia.find((l) => l.symbol === sym);
      return found?.amount ?? 0;
    }
    const c = col.find((x) => x.symbol === sym);
    const s = sup.find((x) => x.symbol === sym);
    return (c?.amount ?? 0) + (s?.amount ?? 0);
  }, [positions, form.asset, result.asset, operation]);

  const current = currentForAsset();
  const delta = Number(amount) / 1e7;
  const isAdd = operation === "blend_supply" || operation === "blend_borrow" || operation === "backstop_deposit";
  const newAmount = current != null ? (isAdd ? current + delta : Math.max(0, current - delta)) : null;

  // Sign & submit
  const handleSign = async () => {
    if (!xdr) return;
    setSigning(true);
    setTxError(null);
    try {
      await checkWalletNetwork();
      const signedXdr = await signTransaction(xdr);
      const MCP_URL = process.env["NEXT_PUBLIC_MCP_STELLAR_URL"] ?? "http://localhost:3009";
      const submitRes = await fetch(`${MCP_URL}/api/aggregator/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr, protocol: "blend" }),
      });
      const submitData = await submitRes.json();
      if (submitData.success) {
        setTxResult(submitData.hash ?? "Submitted");
      } else {
        const e = submitData.error ?? submitData.detail ?? submitData.message ?? "Submission failed";
        setTxError(typeof e === "string" ? e : JSON.stringify(e));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : (typeof err === "object" ? JSON.stringify(err) : String(err));
      if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("reject")) {
        setTxError(msg);
      }
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">Transaction Overview</p>
      </div>

      {/* Overview rows */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Amount */}
        <div className="flex items-center gap-2">
          <TokenImage src={null} alt={symbol} className="h-5 w-5 rounded-full" />
          <span className="text-xs text-muted-foreground">Amount {cfg.verb}</span>
          <span className="ml-auto text-sm font-medium text-foreground tabular-nums">
            {fmtAmount(amount)} {symbol}
          </span>
        </div>

        {/* Gas */}
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Gas</span>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {fmtGas(fee)}
          </span>
        </div>

        {/* Position change: before → after */}
        {current != null && newAmount != null && (
          <>
            <div className="h-px bg-border my-1" />
            <ChangeRow
              label={operation.includes("borrow") || operation === "blend_repay" ? "Your total borrowed" : "Your total supplied"}
              before={`${current.toFixed(4)} ${symbol}`}
              after={`${newAmount.toFixed(4)} ${symbol}`}
            />
          </>
        )}

        {/* Borrow capacity */}
        {positions?.summary?.borrowCapacityUsd != null && (
          <ChangeRow
            label="Borrow capacity"
            before={`$${Number(positions.summary.borrowCapacityUsd).toFixed(2)}`}
            after={operation === "blend_supply" ? `$${(Number(positions.summary.borrowCapacityUsd) + delta * 0.2).toFixed(2)}` : "—"}
          />
        )}

        {/* Borrow limit */}
        {positions?.summary?.borrowLimitRatio != null && (
          <ChangeRow
            label="Borrow limit"
            before={`${(Number(positions.summary.borrowLimitRatio) * 100).toFixed(2)}%`}
            after="—"
          />
        )}

        {/* From address */}
        <div className="h-px bg-border my-1" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">From</span>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{trunc(from)}</span>
        </div>
      </div>

      {/* XDR toggle */}
      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={() => setShowXdr(!showXdr)}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {showXdr ? "Hide XDR" : "Show XDR"}
        </button>
        {showXdr && (
          <pre className="mt-1 max-h-[100px] overflow-auto rounded-lg bg-secondary p-2 text-[10px] text-muted-foreground font-mono break-all">
            {xdr}
          </pre>
        )}
      </div>

      {/* Action area — changes state based on result */}
      <div className="px-4 pb-4">
        {txResult ? (
          /* Success state */
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txResult}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg py-2 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center hover:bg-emerald-500/15 transition-colors"
          >
            Transaction confirmed · {trunc(txResult)}
          </a>
        ) : txError ? (
          /* Error state */
          <div className="rounded-lg py-2 px-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive text-center">
            Failed · {txError.length > 80 ? txError.slice(0, 80) + "…" : txError}
          </div>
        ) : (
          /* Default state — sign button */
          <button
            type="button"
            className="w-full rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            onClick={handleSign}
            disabled={signing || !xdr}
          >
            {signing ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing…</>
            ) : (
              cfg.action
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ChangeRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-xs text-foreground tabular-nums">{before}</span>
      <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      <span className="text-xs text-foreground tabular-nums">{after}</span>
    </div>
  );
}
