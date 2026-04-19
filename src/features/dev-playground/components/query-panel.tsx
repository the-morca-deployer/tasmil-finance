"use client";

import { useState, useCallback } from "react";
import { Loader2, RefreshCw, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import type { PanelConfig } from "../config/protocol-configs";
import {
  PgCard,
  PgCardHeader,
  PgSkeleton,
  PgEmpty,
  PgError,
  JsonViewer,
  TypeBadge,
  ApyDisplay,
  StatusBadge,
  POS_GRID,
} from "./playground-primitives";
// Token image available but not used yet in result renderers

// ─── Input styles ───────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg bg-muted/30 border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";

// ─── QueryPanel ─────────────────────────────────────────────────

interface QueryPanelProps {
  protocol: string;
  panel: PanelConfig;
  walletAddress?: string;
  defaultPool?: string;
}

export function QueryPanel({ protocol, panel, walletAddress, defaultPool }: QueryPanelProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const f of panel.fields) {
      if (f.key === "user" && walletAddress) defaults[f.key] = walletAddress;
      if (f.key === "pool" && defaultPool) defaults[f.key] = defaultPool;
      if (f.key === "address" && defaultPool) defaults[f.key] = defaultPool;
    }
    return defaults;
  });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim())),
      ).toString();
      const url = `/api/protocols/${protocol}/${panel.endpoint}${params ? `?${params}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Request failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [form, protocol, panel.endpoint]);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <PgCard>
      <PgCardHeader
        icon={<RefreshCw className="h-4 w-4" />}
        iconColor="text-cyan-400"
        iconBg="bg-cyan-500/20"
        title={panel.title}
        subtitle={panel.description}
        badge={
          <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded">
            SDK /{panel.endpoint}
          </span>
        }
      />

      {/* Input fields */}
      {panel.fields.length > 0 && (
        <div className="border-t border-border px-5 py-3 space-y-2">
          {panel.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] font-medium text-muted-foreground mb-0.5">
                {f.label}
              </label>
              <input
                className={inputCls}
                value={form[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}

      {/* Fetch button */}
      <div className="border-t border-border px-5 py-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={run}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Fetch
        </Button>

        {result && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => setShowJson(!showJson)}
            >
              {showJson ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={copyJson}
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              Copy
            </Button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 pb-4">
          <PgError message={error} />
        </div>
      )}

      {/* Loading */}
      {loading && !result && <PgSkeleton />}

      {/* Result — rendered as data cards */}
      {result && !showJson && (
        <div className="border-t border-border">
          <ResultRenderer protocol={protocol} panelId={panel.id} data={result} />
        </div>
      )}

      {/* Raw JSON */}
      <AnimatePresence>
        {showJson && result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4">
              <JsonViewer data={result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PgCard>
  );
}

// ─── Result renderers ───────────────────────────────────────────

function ResultRenderer({
  protocol,
  panelId,
  data,
}: {
  protocol: string;
  panelId: string;
  data: Record<string, unknown>;
}) {
  switch (panelId) {
    case "pools":
      return <PoolsResult data={data} />;
    case "pool":
      return <PoolDetailResult data={data} />;
    case "yield":
      return <YieldResult data={data} />;
    case "positions":
      return <PositionsResult data={data} protocol={protocol} />;
    case "quote":
      return <QuoteResult data={data} />;
    case "markets":
      return <MarketsResult data={data} />;
    case "orderbook":
      return <OrderbookResult data={data} />;
    default:
      return <JsonViewer data={data} />;
  }
}

// ─── Pools result ───────────────────────────────────────────────

function PoolsResult({ data }: { data: Record<string, unknown> }) {
  const pools = (data.pools ?? []) as Record<string, unknown>[];
  if (pools.length === 0) return <PgEmpty message="No pools found" />;

  return (
    <div className="divide-y divide-border">
      <div className={cn(POS_GRID, "px-5 py-2")}>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pool</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Assets</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-right">TVL</span>
      </div>
      {pools.map((pool, i) => {
        const name = String(pool.name ?? pool.address ?? `Pool #${i}`);
        const addr = String(pool.address ?? "");
        const status = String(pool.status ?? pool.poolType ?? "ok");
        const reserves = (pool.reserves ?? []) as Record<string, unknown>[];
        const tvl = pool.tvl ?? pool.totalSupply;
        const assetSymbols = reserves.map((r) => String(r.symbol ?? "?")).join(", ");
        const tokens = pool.tokens as { address: string; symbol?: string }[] | undefined;
        const tokenStr = tokens?.map((t) => t.symbol ?? "?").join(", ") ?? assetSymbols;

        return (
          <div key={addr || i} className={cn(POS_GRID, "px-5 py-3 hover:bg-muted/20 transition-colors")}>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{name}</p>
              <p className="text-[11px] text-muted-foreground/60 font-mono truncate">{addr.slice(0, 12)}…</p>
            </div>
            <StatusBadge status={status} />
            <span className="text-xs text-muted-foreground truncate">{tokenStr || "—"}</span>
            <span className="text-sm font-medium text-foreground text-right">
              {tvl != null ? Number(tvl).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pool detail ────────────────────────────────────────────────

function PoolDetailResult({ data }: { data: Record<string, unknown> }) {
  const pool = (data.pool ?? data) as Record<string, unknown>;
  const reserves = (pool.reserves ?? []) as Record<string, unknown>[];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">{String(pool.name ?? pool.address ?? "Pool")}</span>
        {pool.status != null && <StatusBadge status={String(pool.status)} />}
      </div>

      {reserves.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2 border-b border-border">
            <span className="text-[11px] font-medium uppercase text-muted-foreground">Asset</span>
            <span className="text-[11px] font-medium uppercase text-muted-foreground">Supply APY</span>
            <span className="text-[11px] font-medium uppercase text-muted-foreground">Borrow APY</span>
            <span className="text-[11px] font-medium uppercase text-muted-foreground">Utilization</span>
            <span className="text-[11px] font-medium uppercase text-muted-foreground">C-Factor</span>
          </div>
          {reserves.map((r, i) => (
            <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 hover:bg-muted/20">
              <span className="text-sm font-medium text-foreground">{String(r.symbol ?? r.asset ?? "?")}</span>
              <ApyDisplay value={r.supplyApy as number} />
              <ApyDisplay value={r.borrowApy as number} />
              <span className="text-sm text-muted-foreground">
                {r.utilization != null ? `${(Number(r.utilization) * 100).toFixed(1)}%` : "—"}
              </span>
              <span className="text-sm text-muted-foreground">
                {r.collateralFactor != null ? `${(Number(r.collateralFactor) * 100).toFixed(0)}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Yield result ───────────────────────────────────────────────

function YieldResult({ data }: { data: Record<string, unknown> }) {
  const opps = (data.opportunities ?? []) as Record<string, unknown>[];
  if (opps.length === 0) return <PgEmpty message="No yield opportunities" />;

  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[2fr_80px_1fr_1fr_80px] gap-2 px-5 py-2">
        <span className="text-[11px] font-medium uppercase text-muted-foreground">Name</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">Type</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">APY</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">TVL</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">Risk</span>
      </div>
      {opps.map((o, i) => {
        const apy = o.apy as Record<string, unknown> | undefined;
        const totalApy = apy?.total as number | null | undefined;
        return (
          <div key={i} className="grid grid-cols-[2fr_80px_1fr_1fr_80px] gap-2 px-5 py-2.5 hover:bg-muted/20">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{String(o.name ?? "—")}</p>
              <p className="text-[11px] text-muted-foreground/60 truncate">
                {(o.assets as string[] | undefined)?.join(", ") ?? ""}
              </p>
            </div>
            <TypeBadge type={String(o.type ?? "vault")} />
            <ApyDisplay value={totalApy} />
            <span className="text-sm text-muted-foreground">
              {o.tvl ? `$${Number(o.tvl).toLocaleString()}` : "—"}
            </span>
            <StatusBadge status={String(o.risk ?? o.status ?? "ok")} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Positions result ───────────────────────────────────────────

function PositionsResult({ data, protocol }: { data: Record<string, unknown>; protocol: string }) {
  const hasPosition = data.hasPosition as boolean;

  if (!hasPosition) return <PgEmpty message="No positions found for this user" />;

  if (protocol === "blend") {
    const collateral = (data.collateral ?? []) as Record<string, unknown>[];
    const supply = (data.supply ?? []) as Record<string, unknown>[];
    const liabilities = (data.liabilities ?? []) as Record<string, unknown>[];
    const summary = data.summary as Record<string, unknown> | undefined;

    return (
      <div className="p-5 space-y-4">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <SummaryItem label="Total Supplied" value={summary.totalSuppliedUsd} prefix="$" color="text-emerald-400" />
            <SummaryItem label="Total Borrowed" value={summary.totalBorrowedUsd} prefix="$" color="text-orange-400" />
            <SummaryItem label="Borrow Capacity" value={summary.borrowCapacityUsd} prefix="$" color="text-blue-400" />
            <SummaryItem label="Net APY" value={summary.netApy} suffix="%" color="text-primary" />
          </div>
        )}

        {/* Collateral */}
        {collateral.length > 0 && (
          <PositionGroup type="collateral" positions={collateral} />
        )}
        {/* Supply */}
        {supply.length > 0 && (
          <PositionGroup type="supply" positions={supply} />
        )}
        {/* Liabilities */}
        {liabilities.length > 0 && (
          <PositionGroup type="borrow" positions={liabilities} />
        )}
      </div>
    );
  }

  // Generic fallback
  return <JsonViewer data={data} />;
}

function SummaryItem({
  label, value, prefix = "", suffix = "", color,
}: {
  label: string; value: unknown; prefix?: string; suffix?: string; color: string;
}) {
  return (
    <div className="rounded-lg bg-muted/20 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold", color)}>
        {value != null ? `${prefix}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}` : "—"}
      </p>
    </div>
  );
}

function PositionGroup({
  type, positions,
}: {
  type: string; positions: Record<string, unknown>[];
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={type} />
        <span className="text-xs text-muted-foreground">{positions.length} position{positions.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        {positions.map((p, i) => (
          <div key={i} className={cn(POS_GRID, "px-4 py-2.5")}>
            <span className="text-sm font-medium text-foreground">{String(p.symbol ?? "?")}</span>
            <TypeBadge type={type} />
            <span className="text-sm text-foreground">{Number(p.amount ?? 0).toFixed(4)}</span>
            <ApyDisplay value={p.apy as number} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quote result ───────────────────────────────────────────────

function QuoteResult({ data }: { data: Record<string, unknown> }) {
  const quote = (data.quote ?? data) as Record<string, unknown>;
  const paths = data.paths as unknown[] | undefined;

  if (paths) {
    // SDEX paths
    return (
      <div className="p-5 space-y-2">
        <p className="text-sm font-medium text-foreground">{paths.length} path(s) found</p>
        {paths.map((p, i) => {
          const path = p as Record<string, unknown>;
          return (
            <div key={i} className="rounded-lg bg-muted/20 p-3">
              <p className="text-sm font-medium text-foreground">
                Destination: {String(path.destination_amount ?? "?")}
              </p>
              <p className="text-xs text-muted-foreground">
                Via: {((path.path ?? []) as Record<string, string>[]).map((a) => a.asset_code ?? "XLM").join(" → ")}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  // Single quote
  return (
    <div className="p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SummaryItem label="Amount In" value={quote.amountIn} color="text-foreground" />
        <SummaryItem label="Amount Out" value={quote.amountOut} color="text-emerald-400" />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Fee: {String(quote.feePercent ?? quote.fee ?? "—")}</span>
        <span>Time: {String(quote.estimatedTime ?? "—")}</span>
        <span>Status: {String(quote.status ?? "—")}</span>
      </div>
      {Array.isArray(quote.route) && (
        <p className="text-xs text-muted-foreground">
          Route: {(quote.route as string[]).join(" → ")}
        </p>
      )}
    </div>
  );
}

// ─── Markets result ─────────────────────────────────────────────

function MarketsResult({ data }: { data: Record<string, unknown> }) {
  const markets = (data.markets ?? []) as Record<string, unknown>[];
  if (markets.length === 0) return <PgEmpty message="No lending markets" />;

  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-2">
        <span className="text-[11px] font-medium uppercase text-muted-foreground">Market</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">Supply APY</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">Borrow APY</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">Utilization</span>
        <span className="text-[11px] font-medium uppercase text-muted-foreground">TVL</span>
      </div>
      {markets.map((m, i) => (
        <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-2.5 hover:bg-muted/20">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{String(m.name ?? m.poolName ?? m.asset ?? `Market #${i}`)}</p>
          </div>
          <ApyDisplay value={m.supplyApy as number} />
          <ApyDisplay value={m.borrowApy as number} />
          <span className="text-sm text-muted-foreground">
            {m.utilization != null ? `${(Number(m.utilization) * 100).toFixed(1)}%` : "—"}
          </span>
          <span className="text-sm text-muted-foreground">
            {m.tvl ? `$${Number(m.tvl).toLocaleString()}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Orderbook result ───────────────────────────────────────────

function OrderbookResult({ data }: { data: Record<string, unknown> }) {
  const ob = (data.orderbook ?? data) as Record<string, unknown>;
  const bids = (ob.bids ?? []) as Record<string, string>[];
  const asks = (ob.asks ?? []) as Record<string, string>[];

  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-4">
        {/* Bids */}
        <div>
          <p className="text-xs font-medium text-emerald-400 uppercase mb-2">Bids ({bids.length})</p>
          <div className="space-y-0.5">
            {bids.slice(0, 10).map((b, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-emerald-400">{Number(b.price).toFixed(6)}</span>
                <span className="text-muted-foreground">{Number(b.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Asks */}
        <div>
          <p className="text-xs font-medium text-destructive uppercase mb-2">Asks ({asks.length})</p>
          <div className="space-y-0.5">
            {asks.slice(0, 10).map((a, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-destructive">{Number(a.price).toFixed(6)}</span>
                <span className="text-muted-foreground">{Number(a.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
