import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/features/quest/components/ui/badge";
import { buttonClasses } from "@/features/quest/components/ui/button";
import { cn } from "@/lib/utils";
import { AvatarStack } from "./AvatarStack";

export interface CampaignCardData {
  id: string;
  title: string;
  sponsor: string;
  pointsReward: number;
  status: "ongoing" | "closed";
  endsAt: string;
  coverUrl: string | null;
  description?: string;
  participants?: number;
  participantAvatars?: string[];
}

export function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
  const closed = campaign.status === "closed";
  const participants = campaign.participants ?? 0;
  const avatars = campaign.participantAvatars ?? [];

  return (
    <Link
      href={`/quest/campaign/${campaign.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-quest-card border border-quest-line [background:var(--quest-card-grad)]",
        "transition-[border-color,transform,box-shadow] duration-[400ms] ease-quest",
        "hover:-translate-y-1 hover:border-quest-accent-line hover:shadow-[0_30px_70px_-32px_#000,0_0_50px_-28px_var(--color-quest-accent-glow)]",
        closed &&
          "opacity-[0.62] cursor-default hover:translate-y-0 hover:border-quest-line hover:shadow-none",
      )}
    >
      {/* Cover */}
      <div className="relative h-[184px] overflow-hidden border-b border-quest-line bg-[#0c0e10]">
        {campaign.coverUrl ? (
          <img
            alt=""
            src={campaign.coverUrl}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-quest group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(135deg,rgba(255,255,255,0.03) 0 12px,transparent 12px 24px), linear-gradient(160deg,var(--accent-soft),rgba(14,165,233,0.05))",
            }}
          />
        )}
        <Badge variant={closed ? "closed" : "ongoing"} className="absolute top-[13px] left-[13px]">
          {closed ? "Closed" : "Ongoing"}
        </Badge>
        <span className="absolute top-[13px] right-[13px] inline-flex items-center gap-[6px] rounded-quest-pill border border-quest-accent-line bg-[rgba(8,10,12,0.7)] px-4 py-[7px] font-mono text-[12px] font-bold text-quest-accent backdrop-blur-[6px]">
          +{campaign.pointsReward.toLocaleString("en-US")}
          <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id="ptsCoinGCard" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
                <stop stopColor="#A5F3FC" />
                <stop offset="1" stopColor="#0EA5E9" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="9" fill="url(#ptsCoinGCard)" />
            <path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A" />
          </svg>
        </span>
      </div>
      {/* Body */}
      <div className="flex-1 px-5 pt-[18px] pb-[6px]">
        <div className="mb-[7px] text-[17px] font-bold tracking-[-0.02em]">{campaign.title}</div>
        {campaign.description ? (
          <div className="line-clamp-2 text-[13.5px] leading-[1.55] text-quest-muted">
            {campaign.description}
          </div>
        ) : null}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[14px] pb-[18px]">
        <AvatarStack seed={campaign.id} avatars={avatars} total={participants} />
        <span className={buttonClasses({ variant: "primary", size: "sm" })}>
          {closed ? "View" : "Start Quest"}
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
