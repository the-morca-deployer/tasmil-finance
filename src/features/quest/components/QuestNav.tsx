"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUsersControllerGetMe } from "@/gen-quest";
import { useQuestAuthStore } from "../store/use-quest-auth";
import { qAvatar } from "../lib/avatar";
import { Flame, PtsCoin } from "./icons";

const LINKS = [
  { href: "/quest/quest", label: "Explore" },
  { href: "/quest/campaigns", label: "Campaigns" },
  { href: "/quest/leaderboard", label: "Leaderboard" },
  { href: "/quest/profile", label: "My Quests" },
];

interface MeFields {
  totalPoints?: number;
  loginStreak?: number;
  walletAddress?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const shorten = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

export function QuestNav() {
  const path = usePathname() ?? "";
  const { data } = useUsersControllerGetMe();
  const { user } = useQuestAuthStore();

  // The /me payload is typed `any` by the generator; read the fields we need.
  const me = ((data as { data?: MeFields } | undefined)?.data ?? {}) as MeFields;
  const points = me.totalPoints ?? 0;
  const streak = me.loginStreak ?? 0;
  const address = me.walletAddress ?? user?.walletAddress ?? "";

  const isActive = (href: string) => {
    if (href === "/quest/campaigns") {
      return path.startsWith("/quest/campaigns") || path.startsWith("/quest/campaign");
    }
    return path === href || path.startsWith(`${href}/`);
  };

  return (
    <nav className="nav">
      <Link className="nav-brand" href="/quest/quest">
        <span>
          Tasmil <span className="fin">Quest</span>
        </span>
      </Link>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            className={`nav-item${isActive(l.href) ? " active" : ""}`}
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        <span className="stat-pill pts">
          <PtsCoin style={{ width: 20, height: 20 }} />
          {fmt(points)}
        </span>
        <span className="stat-pill streak">
          <Flame style={{ width: 19, height: 19 }} />
          {fmt(streak)}
        </span>
        {address && (
          <span className="wallet-chip">
            <span className="av" style={{ background: qAvatar(address) }} />
            <span className="addr">{shorten(address)}</span>
          </span>
        )}
      </div>
    </nav>
  );
}
