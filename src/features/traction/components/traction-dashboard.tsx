"use client";

import Image from "next/image";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { useTraction } from "../hooks/use-traction";
import { KpiCards } from "./kpi-cards";
import { QuestVolumeList } from "./quest-volume-list";
import { UserGrowthChart } from "./user-growth-chart";
import { VolumeTvlChart } from "./volume-tvl-chart";

export function TractionDashboard() {
  const { data, isLoading, isError, refetch } = useTraction();

  if (isError) {
    // Only the traction KPIs/charts failed. Quest volume is a separate,
    // independently-cached endpoint, so keep rendering it below the notice.
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <Typography variant="h2" className="text-xl">
            Data temporarily unavailable
          </Typography>
          <Typography variant="p" className="text-center text-muted-foreground text-sm">
            Live metrics could not be loaded. Please try again in a moment.
          </Typography>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
        <QuestVolumeList />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/tasmil-logo.png" alt="Tasmil Finance" width={32} height={32} />
          <div>
            <h1 className="font-bold text-2xl">Tasmil Traction</h1>
            <p className="text-muted-foreground text-xs">Live growth metrics — Stellar mainnet</p>
          </div>
        </div>
        {data?.updatedAt && (
          <span className="rounded bg-green-500/10 px-2 py-1 font-semibold text-[11px] text-green-400">
            Live data — updated {new Date(data.updatedAt).toUTCString()}
          </span>
        )}
      </header>

      <KpiCards summary={data?.summary} isLoading={isLoading} />
      <VolumeTvlChart data={data?.volumeTvl} isLoading={isLoading} />
      <UserGrowthChart data={data?.userGrowth} isLoading={isLoading} />
      <QuestVolumeList />

      <footer className="mt-4 border-border border-t pt-4 text-center">
        <a
          href="https://tasmil.finance"
          className="text-muted-foreground text-xs hover:text-foreground"
        >
          tasmil.finance
        </a>
      </footer>
    </div>
  );
}
