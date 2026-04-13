"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminCampaign } from "@/features/admin-whitelist/hooks/use-admin-campaign";
import { Typography } from "@/shared/ui/typography";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Loader2 } from "lucide-react";

interface CampaignStatus {
  status: "RUNNING" | "COMPLETED" | "FAILED" | string;
  targetedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
}

export default function AdminCampaignsPage() {
  const { sendCampaign, getCampaignStatus, isSending } = useAdminCampaign();
  const [campaignName, setCampaignName] = useState("");
  const [targetEmails, setTargetEmails] = useState("");
  const [result, setResult] = useState<{ campaignId: string; targeted: number } | null>(null);
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const handleSendCampaign = async () => {
    const campaignResult = await sendCampaign({
      name: campaignName,
      targetEmails: targetEmails || undefined,
    });

    if (campaignResult) {
      setResult(campaignResult);
      const pollStatus = async () => {
        const s: CampaignStatus = await getCampaignStatus(campaignResult.campaignId);
        setStatus(s);
        if (s.status === "RUNNING") {
          pollTimerRef.current = setTimeout(pollStatus, 2000);
        }
      };
      pollStatus();
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <Typography variant="h1" className="font-bold text-3xl">
          Campaign Management
        </Typography>
        <Typography variant="p" className="mt-1 text-muted-foreground">
          Send access codes to contactable wallet waitlist entries
        </Typography>
      </div>

      {/* Send Campaign Card */}
      <Card className="max-w-2xl border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <div>
            <label htmlFor="campaign-name" className="mb-1.5 block text-sm font-medium">
              Campaign Name
            </label>
            <Input
              id="campaign-name"
              name="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Early Access Wave 1"
            />
          </div>

          <div>
            <label htmlFor="target-emails" className="mb-1.5 block text-sm font-medium">
              Target Emails{" "}
              <span className="text-muted-foreground font-normal">(optional, comma-separated — targets wallets with these emails)</span>
            </label>
            <Input
              id="target-emails"
              name="targetEmails"
              value={targetEmails}
              onChange={(e) => setTargetEmails(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="mt-1 text-muted-foreground text-xs">
              Leave empty to target all contactable wallet entries (wallets with email attached)
            </p>
          </div>

          <Button
            variant="gradient"
            onClick={handleSendCampaign}
            disabled={isSending || !campaignName.trim()}
            className="w-full"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send Campaign"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Campaign Result */}
      {result && (
        <Card className="max-w-2xl border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <Typography variant="h3" className="mb-4 font-semibold text-lg">
              Campaign Result
            </Typography>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Campaign ID:</span>
                <span className="ml-2 font-mono text-xs">{result.campaignId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Targeted:</span>
                <span className="ml-2 font-bold">{result.targeted}</span>
              </div>
            </div>

            {status && (
              <div className="border-t border-border pt-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold">{status.targetedCount}</div>
                    <div className="text-muted-foreground text-xs">Targeted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{status.sentCount}</div>
                    <div className="text-muted-foreground text-xs">Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{status.failedCount}</div>
                    <div className="text-muted-foreground text-xs">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{status.skippedCount}</div>
                    <div className="text-muted-foreground text-xs">Skipped</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 font-mono text-xs ${
                      status.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : status.status === "RUNNING"
                          ? "bg-blue-500/20 text-blue-400"
                          : status.status === "FAILED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {status.status}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
