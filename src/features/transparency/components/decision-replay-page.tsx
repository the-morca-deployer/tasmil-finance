"use client";

import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { useDecisionReplay } from "../api/use-decision-replay";

function stageKey(stage: unknown): string {
  if (stage && typeof stage === "object" && "seq" in stage) {
    return String((stage as { seq: unknown }).seq);
  }
  return JSON.stringify(stage) ?? String(stage);
}

export function DecisionReplayPage({ decisionId }: { decisionId: string }) {
  const state = useDecisionReplay(decisionId);
  if (state.isLoading) {
    return (
      <output className="flex items-center justify-center gap-2 py-24">
        <Loader2 className="h-5 w-5 animate-spin" /> Replaying signed evidence…
      </output>
    );
  }
  if (state.error) {
    return (
      <Card className="mx-auto mt-10 max-w-3xl p-8 text-center">
        <p>Replay unavailable</p>
        <p className="mt-2 text-muted-foreground text-sm">{state.error.message}</p>
        <Button className="mt-4 gap-2" onClick={state.refetch} variant="outline">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </Card>
    );
  }
  if (!state.data) return null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-bold text-2xl">Decision replay</h1>
      <p className="mt-1 break-all font-mono text-muted-foreground text-xs">{decisionId}</p>
      <Card className="mt-5 border-white/10 bg-white/3 p-5">
        <p className="font-medium">
          {state.data.chainValid ? "Signature chain valid" : "Signature chain invalid"}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {state.data.entriesVerified} entries verified · {state.data.network}
        </p>
        <p className="mt-3 break-all font-mono text-muted-foreground text-xs">
          Root {state.data.recomputedRoot}
        </p>
      </Card>
      <div className="mt-4 space-y-3">
        {state.data.stages.map((stage) => (
          <Card className="overflow-hidden border-white/10 bg-white/3 p-4" key={stageKey(stage)}>
            <pre className="whitespace-pre-wrap break-all text-xs">
              {JSON.stringify(stage, null, 2)}
            </pre>
          </Card>
        ))}
      </div>
      <Card className="mt-4 border-white/10 bg-white/3 p-4">
        {state.data.finalTx && state.data.finalTxExplorer ? (
          <a
            className="inline-flex items-center gap-1 break-all text-blue-400 text-sm hover:underline"
            href={state.data.finalTxExplorer}
            rel="noreferrer"
            target="_blank"
          >
            {state.data.finalTx} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : (
          <p className="text-muted-foreground text-sm">No transaction submitted</p>
        )}
      </Card>
    </main>
  );
}
