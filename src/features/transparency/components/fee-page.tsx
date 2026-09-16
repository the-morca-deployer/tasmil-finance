"use client";

import { ExternalLink, Loader2, ReceiptText, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import type { FeePage as FeePageData } from "../api/adapters";
import { useFeeEvents } from "../api/use-fee-events";

type FeeEvent = FeePageData["events"][number];

const feeLabels: Record<FeeEvent["type"], string> = {
  perf_fee: "Performance fee",
  exec_fee: "Execution fee",
  settle: "Settlement",
};

function FeeRow({ event }: { event: FeeEvent }) {
  return (
    <Card className="border-white/10 bg-white/3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{feeLabels[event.type]}</p>
            <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-emerald-300 text-xs">
              Confirmed
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-xs">
            Ledger {event.ledger} · {event.ledgerClosedAt}
          </p>
        </div>
        <div className="text-right">
          <p className="break-all font-mono text-lg">{event.amount ?? "Unavailable"}</p>
          <p className="text-muted-foreground text-xs">raw contract amount</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-white/10 border-t pt-3">
        <p className="max-w-full break-all font-mono text-muted-foreground text-xs">
          {event.txHash}
        </p>
        <a
          className="inline-flex items-center gap-1 text-blue-400 text-xs hover:underline"
          href={event.explorerUrl}
          rel="noreferrer"
          target="_blank"
        >
          View transaction <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </Card>
  );
}

function FeeBody({ state }: { state: ReturnType<typeof useFeeEvents> }) {
  if (state.isLoading) {
    return (
      <output className="flex items-center justify-center gap-2 py-24">
        <Loader2 className="h-5 w-5 animate-spin" /> Reading Stellar fee events…
      </output>
    );
  }
  if (state.error) {
    return (
      <Card className="border-white/10 bg-white/3 p-8 text-center">
        <p className="font-medium">Fee evidence unavailable</p>
        <p className="mt-2 text-muted-foreground text-sm">{state.error.message}</p>
        <Button className="mt-4 gap-2" onClick={state.refetch} variant="outline">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </Card>
    );
  }
  if (!state.data) return null;
  const { data } = state;
  return (
    <>
      <Card className="mb-4 border-white/10 bg-white/3 p-4 text-sm">
        <p>
          Ledger range {data.readRange.effectiveStartLedger ?? data.readRange.oldestLedger}–
          {data.readRange.latestLedger} · {data.network}
        </p>
        <p className="mt-1 break-all font-mono text-muted-foreground text-xs">
          Source contract {data.sourceContract}
        </p>
        {data.readRange.partial && (
          <p className="mt-2 text-amber-300 text-xs">
            Partial ledger range: the requested start predates retained RPC history.
          </p>
        )}
      </Card>
      {data.events.length === 0 ? (
        <Card className="border-white/10 bg-white/3 p-8 text-center">
          No confirmed fee events in this ledger range.
        </Card>
      ) : (
        <div className="space-y-3">
          {data.events.map((event) => (
            <FeeRow event={event} key={event.id} />
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-between">
        <Button disabled={!state.hasPrevious} onClick={state.previousPage} variant="outline">
          Previous page
        </Button>
        <Button
          disabled={!data.nextCursor}
          onClick={() => data.nextCursor && state.nextPage(data.nextCursor)}
          variant="outline"
        >
          Next page
        </Button>
      </div>
    </>
  );
}

export function FeePage() {
  const state = useFeeEvents();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <ReceiptText className="h-7 w-7 text-emerald-400" />
        <div>
          <h1 className="font-bold text-2xl">Protocol fee evidence</h1>
          <p className="text-muted-foreground text-sm">
            Confirmed fee-engine events read from Stellar RPC
          </p>
        </div>
      </div>
      <FeeBody state={state} />
    </main>
  );
}
