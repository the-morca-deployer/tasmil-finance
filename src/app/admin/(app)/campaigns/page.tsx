"use client";

import { Loader2, Send, X } from "lucide-react";
import { useState } from "react";
import {
  type CampaignRun,
  useCampaignHistory,
  useCampaignStatus,
  useSendCampaign,
} from "@/features/admin-whitelist/hooks/use-campaigns";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
    RUNNING: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 animate-pulse",
    FAILED: "bg-red-500/20 text-red-400 hover:bg-red-500/20",
    PENDING: "bg-muted text-muted-foreground hover:bg-muted",
    CANCELLED: "bg-muted text-muted-foreground hover:bg-muted",
  };
  return (
    <Badge className={styles[status] ?? "bg-muted text-muted-foreground hover:bg-muted"}>
      {status}
    </Badge>
  );
}

function ActiveCampaignCard({ campaign }: { campaign: CampaignRun }) {
  const { data: liveStatus } = useCampaignStatus(campaign.id);
  const current = liveStatus ?? campaign;
  const progress =
    current.targetedCount > 0 ? Math.round((current.sentCount / current.targetedCount) * 100) : 0;

  return (
    <div className="space-y-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{current.name}</p>
        <StatusBadge status={current.status} />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-muted-foreground text-xs">
          <span>{current.sentCount} sent</span>
          <span>{current.targetedCount} targeted</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-400">{current.sentCount} sent</span>
        <span className="text-red-400">{current.failedCount} failed</span>
        <span className="text-muted-foreground">{current.skippedCount} skipped</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-full border-red-500/30 text-red-400 text-xs"
        title="Not yet supported"
      >
        Abort (not yet supported)
      </Button>
    </div>
  );
}

function NewCampaignForm() {
  const [name, setName] = useState("");
  const [sendMode, setSendMode] = useState<"all" | "emails">("all");
  const [emailList, setEmailList] = useState("");
  const sendCampaign = useSendCampaign();

  async function handleSend() {
    if (!name.trim()) return;
    const payload: { name: string; targetEmails?: string } = { name };
    if (sendMode === "emails" && emailList.trim()) {
      payload.targetEmails = emailList
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean)
        .join(",");
    }
    await sendCampaign.mutateAsync(payload);
    setName("");
    setEmailList("");
  }

  return (
    <div className="space-y-3">
      <div>
        <Typography variant="h3" className="font-semibold text-sm">
          New Campaign
        </Typography>
        <p className="mt-0.5 text-muted-foreground text-xs">
          Targets all waitlist entries with a confirmed email
        </p>
      </div>
      <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Send to:</p>
        {(["all", "emails"] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="sendMode"
              value={mode}
              checked={sendMode === mode}
              onChange={() => setSendMode(mode)}
            />
            {mode === "all" ? "All CONFIRMED entries" : "Paste emails manually"}
          </label>
        ))}
      </div>
      {sendMode === "emails" && (
        <textarea
          placeholder={"email1@example.com\nemail2@example.com"}
          value={emailList}
          onChange={(e) => setEmailList(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none resize-none"
        />
      )}
      <Button
        variant="gradient"
        onClick={handleSend}
        disabled={sendCampaign.isPending || !name.trim()}
        className="w-full"
      >
        {sendCampaign.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Campaign
          </span>
        )}
      </Button>
    </div>
  );
}

function CampaignDetailDrawer({
  campaign,
  onClose,
}: {
  campaign: CampaignRun;
  onClose: () => void;
}) {
  const progress =
    campaign.targetedCount > 0
      ? Math.round((campaign.sentCount / campaign.targetedCount) * 100)
      : 0;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 360,
        background: "#131720",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        padding: 24,
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>{campaign.name}</h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(245,248,252,0.6)",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Targeted", value: campaign.targetedCount, color: "#F5F8FC" },
          { label: "Sent", value: campaign.sentCount, color: "#34D399" },
          { label: "Failed", value: campaign.failedCount, color: "#FB7185" },
          { label: "Skipped", value: campaign.skippedCount, color: "rgba(245,248,252,0.4)" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(245,248,252,0.4)", marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 8, fontSize: 12, color: "rgba(245,248,252,0.4)" }}>
        Progress: {progress}%
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 4,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: 4,
            background: "linear-gradient(90deg, #00BFFF, #0080FF)",
            transition: "width 0.3s",
          }}
        />
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: "rgba(245,248,252,0.5)" }}>
        {campaign.startedAt && (
          <div>Started: {new Date(campaign.startedAt).toLocaleDateString()}</div>
        )}
        {campaign.completedAt && (
          <div>Completed: {new Date(campaign.completedAt).toLocaleDateString()}</div>
        )}
      </div>
    </div>
  );
}

export default function AdminCampaignsPage() {
  const { data: campaigns, isLoading } = useCampaignHistory();
  const [drawerCampaign, setDrawerCampaign] = useState<CampaignRun | null>(null);

  const activeCampaign = campaigns?.find((c) => c.status === "RUNNING");

  return (
    <div className="flex h-full gap-6 p-8">
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 space-y-6">
        <Typography variant="h2" className="font-bold text-xl">
          Email Campaigns
        </Typography>

        {activeCampaign && <ActiveCampaignCard campaign={activeCampaign} />}

        <NewCampaignForm />
      </div>

      {/* Right panel — history table */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Typography variant="h2" className="mb-4 font-bold text-xl">
          Campaign History
        </Typography>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-border border-b bg-card">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Targeted</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Sent</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Failed</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Skipped</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns?.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/30"
                    onClick={() => setDrawerCampaign(c)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.targetedCount}</td>
                    <td className="px-4 py-3 text-emerald-400">{c.sentCount}</td>
                    <td className="px-4 py-3 text-red-400">{c.failedCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.skippedCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!campaigns || campaigns.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No campaigns yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerCampaign && (
        <CampaignDetailDrawer campaign={drawerCampaign} onClose={() => setDrawerCampaign(null)} />
      )}
    </div>
  );
}
