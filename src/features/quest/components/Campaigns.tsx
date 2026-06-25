"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import { toCampaignCardData } from "@/features/quest/types";
import { cn } from "@/lib/utils";
import { useCampaignsControllerFindAll } from "@/gen-quest/hooks";
import { CampaignCard, type CampaignCardData } from "./CampaignCard";
import { Rise } from "./Rise";

type Filter = "all" | "ongoing" | "closed";

const SEG_BTN =
  "cursor-pointer rounded-quest-pill border-none bg-transparent px-[18px] py-2 text-[13.5px] font-semibold text-quest-muted transition-[color,background] duration-[250ms] hover:text-quest-text";
const SKEL_LINE = "h-[14px] rounded-md bg-white/5";

export default function Campaigns() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { data, isLoading } = useCampaignsControllerFindAll();

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 650);
    return () => clearTimeout(t);
  }, []);

  const allItems: CampaignCardData[] = useMemo(() => {
    if (!data) return [];
    return mapApiCampaignsResponse(data).map(toCampaignCardData);
  }, [data]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (filter !== "all") items = items.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
      );
    }
    return items;
  }, [allItems, filter, search]);

  const clearFilters = useCallback(() => {
    setFilter("all");
    setSearch("");
  }, []);

  const loading = isLoading || showSkeleton;

  return (
    <div>
      <Rise>
        <div className="mb-[26px] flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[clamp(34px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">
              <span className="grad-text">Campaigns</span>
            </h1>
            <p className="mt-3 text-[16px] text-quest-muted">
              Discover quests across the Stellar ecosystem and earn rewards.
            </p>
          </div>
        </div>
      </Rise>

      <Rise delay={0.08}>
        <div className="mb-[26px] flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex gap-0.5 rounded-quest-pill border border-quest-line-2 bg-quest-surface p-1">
            {(["all", "ongoing", "closed"] as Filter[]).map((v) => (
              <button
                key={v}
                className={cn(
                  SEG_BTN,
                  filter === v && "text-quest-accent-ink [background:var(--quest-grad)]",
                )}
                onClick={() => setFilter(v)}
                type="button"
              >
                {v === "all" ? "All" : v === "ongoing" ? "Ongoing" : "Closed"}
              </button>
            ))}
          </div>

          <div className="relative w-[min(320px,100%)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-[15px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-quest-dim"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="h-[46px] w-full rounded-quest-sm border border-quest-line-2 bg-quest-surface pl-4 pr-11 text-[14.5px] text-quest-text outline-none transition-[border-color,box-shadow] duration-[250ms] [font-family:var(--font)] placeholder:text-quest-dim focus:border-quest-accent focus:shadow-[0_0_0_3px_var(--color-quest-accent-soft)]"
              type="text"
              placeholder="Search campaigns"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Rise>

      <Rise delay={0.14}>
        <div className="mb-[18px] text-[13.5px] text-quest-muted">
          Showing <b className="font-mono font-bold text-quest-text">{filtered.length}</b> campaign
          {filtered.length !== 1 ? "s" : ""}
        </div>
      </Rise>

      <Rise delay={0.2}>
        {loading ? (
          <div className="grid grid-cols-3 gap-[22px] max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-quest-card border border-quest-line [background:var(--quest-card-grad)]"
              >
                <div className="h-[184px] bg-white/5" />
                <div className="flex flex-col gap-3 p-5">
                  <div className={SKEL_LINE} style={{ width: "70%" }} />
                  <div className={SKEL_LINE} style={{ width: "90%" }} />
                  <div className={SKEL_LINE} style={{ width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-[14px] px-5 py-20 text-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-14 w-14 text-quest-faint"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <div className="text-[18px] font-bold tracking-[-0.02em] text-quest-text">
              No campaigns match your search
            </div>
            <div className="text-[14px] text-quest-muted">Try a different keyword or filter.</div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              style={{ marginTop: 12 }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[22px] max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
            {filtered.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </Rise>
    </div>
  );
}
