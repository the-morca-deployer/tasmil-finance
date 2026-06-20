"use client";

import Link from "next/link";
import type { Campaign } from "@/features/quest/types";
import { Icon, PtsCoin } from "./icons";
import { qAvatar } from "../lib/avatar";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function AvatarStack({ seed, total }: { seed: string; total: number }) {
  return (
    <div className="av-stack">
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="av" style={{ background: qAvatar(seed + i) }} />
      ))}
      <span className="more">{fmt(total)}</span>
    </div>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const closed = campaign.status === "closed";
  return (
    <Link
      className={`camp-card${closed ? " closed" : ""}`}
      href={`/quest/campaign/${campaign.id}`}
      data-status={campaign.status}
      data-testid="campaign-card"
    >
      <div className="cc-cover">
        <span className="cc-badge-status">
          <span className={`badge ${closed ? "badge-closed" : "badge-ongoing"}`}>
            {closed ? "Closed" : "Ongoing"}
          </span>
        </span>
        <span className="cc-badge-pts">
          +{fmt(campaign.points)} <PtsCoin className="pcoin" />
        </span>
      </div>
      <div className="cc-body">
        <div className="cc-title">{campaign.title}</div>
        <div className="cc-desc">{campaign.description}</div>
      </div>
      <div className="cc-foot">
        <AvatarStack seed={campaign.id} total={campaign.participants} />
        <span className="btn btn-ghost btn-sm">
          {closed ? "View" : "Start Quest"}
          <span className="arr">
            <Icon.arrow width={15} height={15} />
          </span>
        </span>
      </div>
    </Link>
  );
}
