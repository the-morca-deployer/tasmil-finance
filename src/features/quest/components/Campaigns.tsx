"use client";

import { useMemo, useState } from "react";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import { toCampaignCardData } from "@/features/quest/types";
import { useCampaignsControllerFindAll } from "@/gen-quest/hooks";
import { CampaignCard, type CampaignCardData } from "./CampaignCard";
import { Rise } from "./Rise";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

export default function Campaigns() {
  const [status, setStatus] = useState<"ongoing" | "closed">("ongoing");

  const { data, isLoading } = useCampaignsControllerFindAll({ active: status === "ongoing" });

  const items: CampaignCardData[] = useMemo(() => {
    if (!data) return [];
    return mapApiCampaignsResponse(data).map(toCampaignCardData);
  }, [data]);

  return (
    <div>
      <Rise>
        <h1 className="text-[clamp(40px,6vw,68px)] font-bold tracking-[-0.02em]">Campaigns</h1>
      </Rise>
      <Rise>
        <Tabs
          value={status}
          onValueChange={(v) => setStatus(v as "ongoing" | "closed")}
          className="mt-8"
        >
          <TabsList>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </Rise>
      <Rise>
        <div className="camp-grid mt-10">
          {isLoading ? (
            <div className="text-muted">Loading campaigns.</div>
          ) : items.length === 0 ? (
            <div className="text-muted">No {status} campaigns.</div>
          ) : (
            items.map((c) => <CampaignCard key={c.id} campaign={c} />)
          )}
        </div>
      </Rise>
    </div>
  );
}
