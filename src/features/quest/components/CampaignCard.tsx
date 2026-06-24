import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/features/quest/components/ui/badge";

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

function qHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function qAvatar(seed: string): string {
  const h = qHash(seed);
  const a = h % 360;
  const b = (h * 3 + 90) % 360;
  return `radial-gradient(circle at 32% 28%, hsl(${a} 80% 70%), hsl(${b} 75% 42%) 75%)`;
}

function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function AvatarStack({
  campaignId,
  avatars,
  total,
}: {
  campaignId: string;
  avatars: string[];
  total: number;
}) {
  const shown = avatars.slice(0, 4);
  const hasFallbacks = shown.length === 0 && total > 0;
  const fallbackSeeds = hasFallbacks ? [0, 1, 2, 3] : [];

  return (
    <div className="av-stack">
      {shown.map((url, i) => (
        <span
          key={i}
          className="av"
          style={{
            backgroundImage: `url(${url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
      {fallbackSeeds.map((i) => (
        <span key={`fb-${i}`} className="av" style={{ background: qAvatar(campaignId + i) }} />
      ))}
      <span className="more">{fmtCount(total)}</span>
    </div>
  );
}

export function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
  const closed = campaign.status === "closed";
  const participants = campaign.participants ?? 0;
  const avatars = campaign.participantAvatars ?? [];

  return (
    <Link
      href={`/quest/campaign/${campaign.id}`}
      className={`camp-card group${closed ? " closed" : ""}`}
    >
      <div className="cc-cover">
        {campaign.coverUrl ? (
          <img src={campaign.coverUrl} alt="" className="cc-cover-img" />
        ) : null}
        <span className="cc-badge-status">
          <Badge variant={closed ? "closed" : "ongoing"}>{closed ? "Closed" : "Ongoing"}</Badge>
        </span>
        <span className="cc-badge-pts">
          +{campaign.pointsReward.toLocaleString("en-US")}
          <svg className="pcoin" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
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
      <div className="cc-body">
        <div className="cc-title">{campaign.title}</div>
        {campaign.description ? <div className="cc-desc">{campaign.description}</div> : null}
      </div>
      <div className="cc-foot">
        <AvatarStack campaignId={campaign.id} avatars={avatars} total={participants} />
        <span className="btn btn-ghost btn-sm">
          {closed ? "View" : "Start Quest"}
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
