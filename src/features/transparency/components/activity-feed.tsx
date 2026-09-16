"use client";

import { ExternalLink, Loader2, RefreshCw, ScrollText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import type { ActivityPage } from "../api/adapters";
import { useActivityFeed } from "../api/use-activity-feed";

type ActivityItem = ActivityPage["items"][number];

function payloadField(item: ActivityItem, key: string): string | null {
  if (!item.payload || typeof item.payload !== "object" || !(key in item.payload)) return null;
  const value = (item.payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function activityLabel(item: ActivityItem): string {
  if (item.txStatus === "CONFIRMED") return "Execution confirmed";
  if (item.txStatus === "UNKNOWN" || item.entryType === "UNKNOWN") return "Submission unknown";
  const rule = payloadField(item, "rule");
  if (rule === "NET_EDGE") return "Net-Edge declined";
  if (rule === "PRICE_INTEGRITY") return "Price evidence refused";
  if (rule === "POLICY") return "Policy rejected";
  return item.entryType.replaceAll("_", " ").toLowerCase();
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const label = activityLabel(item);
  return (
    <Card className="border-white/10 bg-white/3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{label}</p>
          <p className="mt-1 text-muted-foreground text-xs">
            {item.entryType} · ledger {item.latestLedger ?? "unavailable"} · {item.createdAt}
          </p>
        </div>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs">
          {item.txStatus ?? payloadField(item, "decision") ?? "Recorded"}
        </span>
      </div>
      <p className="mt-3 break-all font-mono text-muted-foreground text-xs">
        Decision {item.decisionId ?? "not assigned"}
      </p>
      <div className="mt-3 border-white/10 border-t pt-3">
        {item.txHash && item.explorerUrl ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="max-w-full break-all font-mono text-muted-foreground text-xs">
              {item.txHash}
            </p>
            <a
              className="inline-flex items-center gap-1 text-blue-400 text-xs hover:underline"
              href={item.explorerUrl}
              rel="noreferrer"
              target="_blank"
            >
              View transaction <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">No transaction submitted</p>
            {item.decisionId && (
              <Link
                className="text-blue-400 text-xs hover:underline"
                href={`/activity/${encodeURIComponent(item.decisionId)}`}
              >
                Replay evidence
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function ActivityBody({ state }: { state: ReturnType<typeof useActivityFeed> }) {
  if (!state.walletConnected) {
    return <Card className="p-8 text-center">Connect your wallet to read account evidence.</Card>;
  }
  if (state.isLoading) {
    return (
      <output className="flex items-center justify-center gap-2 py-24">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading policy evidence…
      </output>
    );
  }
  if (state.error) {
    return (
      <Card className="border-white/10 bg-white/3 p-8 text-center">
        <p className="font-medium">Activity evidence unavailable</p>
        <p className="mt-2 text-muted-foreground text-sm">{state.error.message}</p>
        <Button className="mt-4 gap-2" onClick={state.refetch} variant="outline">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </Card>
    );
  }
  if (!state.accountId) {
    return <Card className="p-8 text-center">No SOW2 vault account was found.</Card>;
  }
  if (!state.data) return null;
  return (
    <>
      {state.data.items.length === 0 ? (
        <Card className="border-white/10 bg-white/3 p-8 text-center">No policy activity yet.</Card>
      ) : (
        <div className="space-y-3">
          {state.data.items.map((item) => (
            <ActivityRow item={item} key={item.id} />
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-between">
        <Button disabled={!state.hasPrevious} onClick={state.previousPage} variant="outline">
          Previous page
        </Button>
        <Button
          disabled={!state.data.nextCursor}
          onClick={() => state.data?.nextCursor && state.nextPage(state.data.nextCursor)}
          variant="outline"
        >
          Next page
        </Button>
      </div>
    </>
  );
}

export function ActivityFeed() {
  const state = useActivityFeed();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-blue-400" />
        <div>
          <h1 className="font-bold text-2xl">Policy activity</h1>
          <p className="text-muted-foreground text-sm">
            Signed decisions, refusals and execution outcomes
          </p>
        </div>
      </div>
      <ActivityBody state={state} />
    </main>
  );
}
