"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBackendBaseUrl } from "@/lib/kubb-backend";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useOnchainTraction, useOnchainTxs } from "../hooks/use-onchain-traction";
import { fmtInt, fmtUsd, fmtUsdCompact } from "../lib/format";
import {
  describeReason,
  explorerAddress,
  explorerTx,
  type OnchainTraction,
  shortHash,
} from "../onchain";

type View = "combined" | "vault" | "userSigned";

const VIEW_LABELS: Record<View, string> = {
  combined: "All",
  vault: "Vault (managed)",
  userSigned: "User-signed via Tasmil",
};

const COVERAGE_STYLES: Record<OnchainTraction["coverage"]["state"], string> = {
  FULL: "bg-green-500/10 text-green-400",
  PARTIAL: "bg-amber-500/10 text-amber-400",
  UNAVAILABLE: "bg-muted text-muted-foreground",
};

function totalsFor(data: OnchainTraction, view: View) {
  return view === "combined" ? data.summary : data.summary.split[view];
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="border-border border-t-2 border-t-emerald-500/60 bg-card">
      <CardContent className="p-4">
        <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="font-bold text-2xl leading-none">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-blue-400 hover:underline"
    >
      {children}
    </a>
  );
}

function SeriesChart({ series }: { series: OnchainTraction["series"] }) {
  if (series.length < 2) return null;
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} minTickGap={24} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => fmtUsdCompact(v)}
            width={56}
          />
          <Tooltip formatter={(v) => fmtUsd(Number(v))} />
          <Area type="monotone" dataKey="tvlUsd" name="TVL" stroke="#10b981" fill="#10b98133" />
          <Area
            type="monotone"
            dataKey="volumeUsd"
            name="Cumulative volume"
            stroke="#3b82f6"
            fill="#3b82f622"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TxTable() {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useOnchainTxs();
  const rows = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (isError) return <p className="text-muted-foreground text-xs">Transactions unavailable.</p>;
  if (rows.length === 0)
    return <p className="text-muted-foreground text-xs">No verified transactions yet.</p>;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 pr-3 font-normal">Tx</th>
              <th className="py-1 pr-3 font-normal">Ledger</th>
              <th className="py-1 pr-3 font-normal">Path</th>
              <th className="py-1 pr-3 font-normal">Kind</th>
              <th className="py-1 pr-3 font-normal">Wallet</th>
              <th className="py-1 font-normal">USD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr key={tx.txHash} className="border-border border-t">
                <td className="py-1 pr-3">
                  <ExternalLink href={explorerTx(tx.txHash)}>{shortHash(tx.txHash)}</ExternalLink>
                </td>
                <td className="py-1 pr-3">{fmtInt(tx.ledger)}</td>
                <td className="py-1 pr-3">{tx.source === "VAULT" ? "Vault" : "User-signed"}</td>
                <td className="py-1 pr-3">{tx.kind}</td>
                <td className="py-1 pr-3">
                  {tx.wallet ? (
                    <ExternalLink href={explorerAddress(tx.wallet)}>
                      {shortHash(tx.wallet)}
                    </ExternalLink>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-1">{tx.amountUsd === null ? "-" : fmtUsd(tx.amountUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  );
}

/**
 * SOW2 Deliverable 5: protocol-wide traction pulled from Stellar mainnet.
 * Independent query, so a failure here never hides the legacy sections.
 */
export function OnchainEvidenceSection() {
  const { data, isLoading, isError, refetch } = useOnchainTraction();
  const [view, setView] = useState<View>("combined");
  const exportBase = `${getBackendBaseUrl()}/api/public/traction/onchain/export`;

  return (
    <section className="space-y-4" aria-labelledby="onchain-evidence-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="onchain-evidence-heading" className="font-semibold text-base">
            On-chain evidence - Stellar mainnet
          </h2>
          <p className="text-muted-foreground text-xs">
            Every figure below is derived only from transactions confirmed on Horizon.
          </p>
        </div>
        {data && (
          <span
            className={`rounded px-2 py-1 font-semibold text-[11px] ${COVERAGE_STYLES[data.coverage.state]}`}
          >
            Coverage: {data.coverage.state}
          </span>
        )}
      </div>

      {isError && (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
            <span className="text-muted-foreground">On-chain evidence could not be loaded.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-24 w-full" data-testid="onchain-skeleton" />}

      {data && (
        <>
          <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0" aria-label="Traction path">
            {(Object.keys(VIEW_LABELS) as View[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={view === key ? "default" : "outline"}
                aria-pressed={view === key}
                onClick={() => setView(key)}
              >
                {VIEW_LABELS[key]}
              </Button>
            ))}
          </fieldset>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Total Value Locked"
              value={fmtUsdCompact(totalsFor(data, view).tvlUsd)}
              sub={
                view === "userSigned"
                  ? "Net deposits (deposits - withdrawals)"
                  : "Verified on-chain"
              }
            />
            <Kpi
              label="Volume"
              value={fmtUsdCompact(totalsFor(data, view).volumeUsd)}
              sub="All-time, verified"
            />
            <Kpi
              label="Transactions"
              value={fmtInt(totalsFor(data, view).transactions)}
              sub="Distinct verified tx hashes"
            />
            <Kpi
              label="Wallets"
              value={fmtInt(totalsFor(data, view).wallets)}
              sub="Distinct on-chain addresses"
            />
          </div>

          <SeriesChart series={data.series} />

          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-4 text-xs">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Ledger range</dt>
                  <dd>
                    {data.range.fromLedger === null
                      ? "-"
                      : `${fmtInt(data.range.fromLedger)} - ${fmtInt(data.range.toLedger ?? data.range.fromLedger)}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Snapshot</dt>
                  <dd>
                    {data.snapshotDay ?? "-"} (updated {new Date(data.updatedAt).toUTCString()})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Execution router</dt>
                  <dd>
                    {data.contracts.executionRouter ? (
                      <ExternalLink href={explorerAddress(data.contracts.executionRouter)}>
                        {shortHash(data.contracts.executionRouter)}
                      </ExternalLink>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Horizon verification</dt>
                  <dd>
                    {fmtInt(data.verification.verified)} verified,{" "}
                    {fmtInt(data.verification.failed)} failed, {fmtInt(data.verification.notFound)}{" "}
                    not found
                  </dd>
                </div>
              </dl>
              {data.contracts.venues.length > 0 && (
                <div>
                  <p className="text-muted-foreground">Vault venues</p>
                  <ul className="mt-1 space-y-1">
                    {data.contracts.venues.map((v) => (
                      <li key={v.venue}>
                        <ExternalLink href={explorerAddress(v.venue)}>
                          {shortHash(v.venue)}
                        </ExternalLink>{" "}
                        {v.symbol ?? "unknown asset"} - TVL{" "}
                        {v.tvlUsd === null ? `${v.balanceBaseUnits} base units` : fmtUsd(v.tvlUsd)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.coverage.reasons.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-amber-400">
                  {data.coverage.reasons.map((r) => (
                    <li key={r}>{describeReason(r)}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`${exportBase}?format=json`}>Download evidence (JSON)</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`${exportBase}?format=csv`}>Download evidence (CSV)</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-4">
              <h3 className="font-medium text-sm">Verified transactions</h3>
              <TxTable />
            </CardContent>
          </Card>

          <details className="text-muted-foreground text-xs">
            <summary className="cursor-pointer">Methodology</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {data.methodology.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
