"use client";

import { useMemo, useState } from "react";
import { useReferralControllerGetTree } from "@/gen-quest";
import { qAvatar } from "../lib/avatar";
import { $ } from "../lib/kubb-config";
import { type ReferralTree, type ReferralTreeNode, unwrapEnvelope } from "../lib/season-types";
import { Icon, PtsCoin } from "./icons";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const pct = (bps: number) => `${Math.round(bps / 100)}%`;

const Pts = () => <PtsCoin style={{ width: 14, height: 14, verticalAlign: "-2px", marginLeft: 3 }} />;

const LayerBadge = ({ l }: { l: number }) => (
  <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 font-semibold text-[11px] text-foreground">
    L{l}
  </span>
);

const StatusBadge = ({ s }: { s: "active" | "inactive" }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-[11px] capitalize ${
      s === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/20 text-muted-foreground"
    }`}
  >
    {s}
  </span>
);

interface FlatRow {
  userId: string;
  name: string;
  layer: number;
  q: number;
  e: number;
  status: "active" | "inactive";
}

function flatten(nodes: ReferralTreeNode[], out: FlatRow[] = []): FlatRow[] {
  for (const n of nodes) {
    out.push({ userId: n.userId, name: n.name, layer: n.layer, q: n.q, e: n.e, status: n.status });
    if (n.children?.length) flatten(n.children, out);
  }
  return out;
}

function TreeRow({ node, depth }: { node: ReferralTreeNode; depth: number }) {
  const [open, setOpen] = useState(depth === 0);
  const hasKids = node.children?.length > 0;
  const pad = Math.min(depth, 2) * 24 + 12;
  return (
    <div>
      <button
        type="button"
        onClick={() => hasKids && setOpen((o) => !o)}
        className="flex w-full items-center gap-3 border-border border-b py-2.5 text-left"
        style={{ paddingLeft: pad }}
      >
        <span className="w-4 flex-none text-muted-foreground">
          {hasKids ? (
            <Icon.chev width={14} height={14} style={{ transform: open ? "rotate(90deg)" : "none" }} />
          ) : null}
        </span>
        <span
          className="block h-7 w-7 flex-none rounded-full"
          style={{ background: qAvatar(node.name) }}
        />
        <span className="min-w-0 flex-1 truncate font-medium text-foreground text-sm">
          {node.name}
        </span>
        <LayerBadge l={node.layer} />
        <StatusBadge s={node.status} />
        <span className="w-24 text-right font-mono text-foreground text-sm">
          {fmt(node.q)}
          <Pts />
        </span>
        <span className="w-24 text-right font-mono text-emerald-400 text-sm">
          {fmt(node.e)}
          <Pts />
        </span>
      </button>
      {hasKids &&
        open &&
        node.children.map((c) => <TreeRow key={c.userId} node={c} depth={depth + 1} />)}
    </div>
  );
}

const HOW = [
  {
    icon: Icon.users,
    tier: "L1 Direct",
    title: "Invite a Friend",
    desc: "Earn from every direct referral's quest activity, paid in points.",
  },
  {
    icon: Icon.network,
    tier: "L2 Indirect",
    title: "Network Rewards",
    desc: "Earn from your friends' referrals' quest activity as they grow.",
  },
  {
    icon: Icon.globe,
    tier: "L3 Deep Network",
    title: "3rd Layer Earnings",
    desc: "Earn from third-level referrals' quest activity, forever.",
  },
];

export function Referrals() {
  const [view, setView] = useState<"list" | "tree">("list");
  const { data: raw, isLoading } = useReferralControllerGetTree($);
  const referral = useMemo(() => unwrapEnvelope<ReferralTree>(raw), [raw]);

  const rates = referral?.rates ?? [];
  const rows = useMemo(() => flatten(referral?.tree ?? []), [referral]);
  const totalInvited = rows.length;
  const totalActive = rows.filter((r) => r.status === "active").length;
  const totalCommission = referral?.totalCommissionPoints ?? 0;

  const rateFor = (layer: number) => rates.find((r) => r.layer === layer)?.rateBps ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-foreground text-xl">Referrals</h2>

      {/* Earnings summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card rounded-2xl border border-line p-5">
          <div className="text-muted text-xs uppercase tracking-wide">Commission Earned</div>
          <div className="flex items-center gap-1 font-bold text-2xl text-foreground">
            {fmt(totalCommission)}
            <PtsCoin style={{ width: 20, height: 20 }} />
          </div>
        </div>
        <div className="stat-card rounded-2xl border border-line p-5">
          <div className="text-muted text-xs uppercase tracking-wide">Total Invited</div>
          <div className="font-bold text-2xl text-foreground">{fmt(totalInvited)}</div>
        </div>
        <div className="stat-card rounded-2xl border border-line p-5">
          <div className="text-muted text-xs uppercase tracking-wide">Active</div>
          <div className="font-bold text-2xl text-emerald-400">{fmt(totalActive)}</div>
        </div>
      </div>

      {/* Commission-rate cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {HOW.map((h, i) => (
          <div key={h.tier} className="rounded-2xl border border-line p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-accent">
                <h.icon width={18} height={18} />
              </span>
              <span className="font-bold text-accent text-xl">{pct(rateFor(i + 1))}</span>
            </div>
            <div className="mt-3 font-semibold text-foreground text-xs uppercase tracking-wide">
              {h.tier}
            </div>
            <div className="mt-1 font-semibold text-foreground">{h.title}</div>
            <p className="mt-1 text-muted-foreground text-sm">{h.desc}</p>
          </div>
        ))}
      </div>

      {/* List / Tree toggle */}
      <div className="flex items-center gap-2 border-line border-b">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`pnav-item${view === "list" ? " active" : ""}`}
        >
          Referral List
        </button>
        <button
          type="button"
          onClick={() => setView("tree")}
          className={`pnav-item${view === "tree" ? " active" : ""}`}
        >
          Referral Tree
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading referrals…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No referrals yet. Share your code to start earning commission.
        </p>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[1fr_70px_110px_110px] gap-3 px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            <span>Username</span>
            <span>Layer</span>
            <span className="text-right">Quest PTS</span>
            <span className="text-right">PTS Earned</span>
          </div>
          <div className="divide-y divide-border">
            {rows.map((u) => (
              <div
                key={u.userId}
                className="grid grid-cols-[1fr_70px_110px_110px] items-center gap-3 px-4 py-3"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="block h-7 w-7 flex-none rounded-full"
                    style={{ background: qAvatar(u.name) }}
                  />
                  <span className="truncate font-medium text-foreground text-sm">{u.name}</span>
                  <StatusBadge s={u.status} />
                </span>
                <span>
                  <LayerBadge l={u.layer} />
                </span>
                <span className="text-right font-mono text-foreground text-sm">
                  {fmt(u.q)}
                  <Pts />
                </span>
                <span className="text-right font-mono text-emerald-400 text-sm">
                  {fmt(u.e)}
                  <Pts />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {(referral?.tree ?? []).map((n) => (
            <TreeRow key={n.userId} node={n} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
