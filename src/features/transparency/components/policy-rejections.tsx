"use client";

import { Ban, ExternalLink, ShieldAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { type PolicyRejection, usePolicyRejections } from "../api/use-policy-rejections";

const KIND: Record<
  PolicyRejection["kind"],
  { label: string; icon: typeof Ban; tone: string; fallback: string }
> = {
  NET_EDGE_DECLINE: {
    label: "Net-Edge declined",
    icon: Ban,
    tone: "bg-amber-500/10 text-amber-400",
    fallback: "Expected gain was below the total cost",
  },
  PRICE_REFUSAL: {
    label: "Price guard refused",
    icon: ShieldAlert,
    tone: "bg-amber-500/10 text-amber-400",
    fallback: "Price evidence could not be trusted",
  },
  GUARD_REFUSAL: {
    label: "Guard refused",
    icon: ShieldAlert,
    tone: "bg-amber-500/10 text-amber-400",
    fallback: "A safety check failed",
  },
  POLICY_REJECTED: {
    label: "Rejected on-chain",
    icon: XCircle,
    tone: "bg-destructive/10 text-destructive",
    fallback: "Policy Guard reverted the transaction",
  },
};

const short = (value: string) =>
  value.length <= 12 ? value : `${value.slice(0, 4)}...${value.slice(-4)}`;

function RejectionRow({ item }: { item: PolicyRejection }) {
  const kind = KIND[item.kind];
  const Icon = kind.icon;
  return (
    <div className="flex flex-wrap items-start gap-3 border-white/10 border-t px-4 py-3 first:border-t-0">
      <div
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", kind.tone)}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{kind.label}</p>
        <p className="text-muted-foreground text-sm">{item.reason ?? kind.fallback}</p>
        <p className="mt-1 text-muted-foreground text-xs">
          {item.code && <span className="font-mono">{item.code}</span>}
          {item.code && " | "}
          {item.keeperWallet ? `Vault ${short(item.keeperWallet)}` : "Vault unknown"}
          {item.latestLedger && ` | ledger ${item.latestLedger}`}
          {` | ${new Date(item.createdAt).toUTCString()}`}
        </p>
      </div>
      {item.explorerUrl ? (
        <a
          className="inline-flex shrink-0 items-center gap-1 text-blue-400 text-xs hover:underline"
          href={item.explorerUrl}
          rel="noreferrer"
          target="_blank"
        >
          View transaction <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="shrink-0 text-muted-foreground text-xs">Blocked before submission</span>
      )}
    </div>
  );
}

/** SOW2 Deliverable 2: every policy rejection, next to the fee events. */
export function PolicyRejections() {
  const { data, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePolicyRejections();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="mt-10" aria-labelledby="policy-rejections-heading">
      <h2 id="policy-rejections-heading" className="font-semibold text-lg">
        Policy rejections
      </h2>
      <p className="mb-4 text-muted-foreground text-sm">
        Every agent action the guards blocked: Net-Edge declines, price-guard refusals and Policy
        Guard reverts recorded on-chain.
      </p>
      {isLoading ? (
        <Card className="border-white/10 bg-white/3 p-6 text-muted-foreground text-sm">
          Loading rejections...
        </Card>
      ) : isError ? (
        <Card className="flex items-center justify-between gap-3 border-white/10 bg-white/3 p-4 text-sm">
          <span className="text-muted-foreground">Policy rejections could not be loaded.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-white/10 bg-white/3 p-6 text-muted-foreground text-sm">
          No policy rejections recorded yet.
        </Card>
      ) : (
        <Card className="overflow-hidden border-white/10 bg-white/3 p-0">
          {items.map((item) => (
            <RejectionRow key={item.id} item={item} />
          ))}
        </Card>
      )}
      {hasNextPage && (
        <Button
          className="mt-3"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
          size="sm"
          variant="outline"
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}
    </section>
  );
}
