"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/features/admin-auth/store/use-admin-auth-store";
import { useAdminCampaign } from "@/features/admin-whitelist/hooks/use-admin-campaign";
import { Typography } from "@/shared/ui/typography";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Loader2 } from "lucide-react";

export default function AdminCampaignsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuthStore();
  const { sendCampaign, getCampaignStatus, isSending } = useAdminCampaign();
  const [campaignName, setCampaignName] = useState("");
  const [targetEmails, setTargetEmails] = useState("");
  const [result, setResult] = useState<{ campaignId: string; targeted: number } | null>(null);
  const [status, setStatus] = useState<any>(null);

  if (!isAuthenticated) {
    router.push("/admin/login");
    return null;
  }

  const handleSendCampaign = async () => {
    const campaignResult = await sendCampaign({
      name: campaignName,
      targetEmails: targetEmails || undefined,
    });

    if (campaignResult) {
      setResult(campaignResult);
      // Poll for status
      const pollStatus = async () => {
        const s = await getCampaignStatus(campaignResult.campaignId);
        setStatus(s);
        if (s.status !== "RUNNING") return;
        setTimeout(pollStatus, 2000);
      };
      pollStatus();
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <Typography variant="h1" className="font-bold text-3xl">
          Campaign Management
        </Typography>
        <Typography variant="p" className="text-muted-foreground mt-1">
          Send early access emails to waitlist registrants
        </Typography>
      </div>

      {/* Send Campaign Card */}
      <Card className="border-border bg-card max-w-2xl">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Campaign Name</label>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Early Access Wave 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Target Emails <span className="text-muted-foreground font-normal">(optional, comma-separated)</span>
            </label>
            <Input
              value={targetEmails}
              onChange={(e) => setTargetEmails(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="text-muted-foreground text-xs mt-1">
              Leave empty to target all eligible waitlist entries
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
        <Card className="border-border bg-card max-w-2xl">
          <CardContent className="p-6">
            <Typography variant="h3" className="font-semibold text-lg mb-4">
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
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold">{status.targetedCount}</div>
                    <div className="text-xs text-muted-foreground">Targeted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{status.sentCount}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{status.failedCount}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{status.skippedCount}</div>
                    <div className="text-xs text-muted-foreground">Skipped</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                    status.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" :
                    status.status === "RUNNING" ? "bg-blue-500/20 text-blue-400" :
                    status.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
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