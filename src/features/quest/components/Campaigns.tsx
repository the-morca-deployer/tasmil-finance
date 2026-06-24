"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import { toCampaignCardData } from "@/features/quest/types";
import { useCampaignsControllerFindAll } from "@/gen-quest/hooks";
import { CampaignCard, type CampaignCardData } from "./CampaignCard";
import { Rise } from "./Rise";

type Filter = "all" | "ongoing" | "closed";

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

    if (filter !== "all") {
      items = items.filter((c) => c.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
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
        <div className="c-head">
          <div>
            <h1>
              <span>Campaigns</span>
            </h1>
            <p>Discover quests across the Stellar ecosystem and earn rewards.</p>
          </div>
        </div>
      </Rise>

      <Rise delay={0.08}>
        <div className="c-bar">
          <div className="segmented">
            {(["all", "ongoing", "closed"] as Filter[]).map((v) => (
              <button
                key={v}
                className={filter === v ? "active" : ""}
                onClick={() => setFilter(v)}
                type="button"
              >
                {v === "all" ? "All" : v === "ongoing" ? "Ongoing" : "Closed"}
              </button>
            ))}
          </div>

          <div className="search-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search campaigns"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Rise>

      <Rise delay={0.14}>
        <div className="c-count" style={{ marginBottom: 18 }}>
          Showing <b>{filtered.length}</b> campaign{filtered.length !== 1 ? "s" : ""}
        </div>
      </Rise>

      <Rise delay={0.2}>
        {loading ? (
          <div className="camp-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skel">
                <div className="s-img" />
                <div className="s-body">
                  <div className="s-line" style={{ width: "70%" }} />
                  <div className="s-line" style={{ width: "90%" }} />
                  <div className="s-line" style={{ width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <div className="et">No campaigns match your search</div>
            <div className="es">Try a different keyword or filter.</div>
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
          <div className="camp-grid">
            {filtered.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </Rise>
    </div>
  );
}
