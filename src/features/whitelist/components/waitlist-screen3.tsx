"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWalletStatus } from "@/features/whitelist/hooks/use-wallet-waitlist";
import { fireConfettiBurst } from "@/features/whitelist/lib/confetti-burst";
import {
  buildReferralUrl,
  buildXShareText,
  copyToClipboard,
  openXShare,
} from "@/features/whitelist/lib/share-to-x";
import { useWallet } from "@/shared/context/wallet-context";
import { ProgressStepper, type Step } from "./ui/stepper";

interface WaitlistScreen3Props {
  /** Email submitted in Screen2 this session u2014 null if skipped */
  submittedEmail: string | null;
}

export function WaitlistScreen3({ submittedEmail }: WaitlistScreen3Props) {
  const { address, displayAddress } = useWallet();
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useWalletStatus(address);
  const [copied, setCopied] = useState(false);
  const [attachedEmail, setAttachedEmail] = useState<string | null>(submittedEmail);

  // Restore email from localStorage on mount (persists across page revisits)
  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`waitlist_email_${address}`);
    if (saved) setAttachedEmail(saved);
  }, [address]);

  // Sync submittedEmail prop u2192 local state + localStorage
  useEffect(() => {
    if (!submittedEmail || !address) return;
    setAttachedEmail(submittedEmail);
    localStorage.setItem(`waitlist_email_${address}`, submittedEmail);

    // Fire confetti on email step dot
    setTimeout(() => {
      const dot = document.querySelector("[data-step='email']") as HTMLElement | null;
      if (dot) fireConfettiBurst(dot);
    }, 250);

    // Background refetch to sync server state
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
    }, 300);
  }, [submittedEmail, address, queryClient]);

  const hasEmailCompleted = !!(status?.hasEmail || attachedEmail);

  const steps: Step[] = [
    { id: "wallet", label: "Connect", state: "done" },
    { id: "email", label: "Email", state: hasEmailCompleted ? "done" : "inactive" },
    { id: "done", label: "Done", state: hasEmailCompleted ? "done" : "active" },
  ];

  const referralUrl = buildReferralUrl(status?.referralCode) ?? null;

  async function handleCopy() {
    if (!referralUrl) return;
    const ok = await copyToClipboard(referralUrl);
    if (ok) {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleShareX() {
    if (!referralUrl) return;
    openXShare(buildXShareText(referralUrl));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const S = {
    lbl: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.16em",
      textTransform: "uppercase" as const,
      color: "rgba(245,248,252,0.34)",
      marginBottom: 7,
    },
    val: {
      fontSize: 25,
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 1,
      color: "#F5F8FC",
    },
    sub: { marginTop: 6, fontSize: 12, color: "rgba(245,248,252,0.56)" },
    box: {
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16,
      background: "#070b12",
      padding: "15px 16px",
    },
    iconBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: 99,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.11)",
      color: "#F5F8FC",
      cursor: "pointer",
      flexShrink: 0,
    } as React.CSSProperties,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ProgressStepper steps={steps} />

      {/* Wallet identity */}
      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          padding: "11px 14px",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F8FC", lineHeight: 1.3 }}>
          Registered as <span style={{ fontFamily: "monospace" }}>{displayAddress}</span>
        </p>
        <p style={{ fontSize: 12, color: "rgba(245,248,252,0.56)", marginTop: 2 }}>
          Wallet verified.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={S.box}>
          <div style={S.lbl}>Queue rank</div>
          <div style={S.val}>
            {status?.queueRank != null ? `#${status.queueRank}` : "—"}
            {status?.totalEntries != null && status?.queueRank != null && (
              <small style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,248,252,0.56)" }}>
                {" "}
                of {status.totalEntries}
              </small>
            )}
          </div>
          <div style={S.sub}>Your position</div>
        </div>
        <div style={S.box}>
          <div style={S.lbl}>Referrals</div>
          <div style={{ ...S.val, color: "oklch(0.87 0.12 192)" }}>
            {status?.successfulReferralCount ?? 0}
          </div>
          <div style={S.sub}>Invite to climb</div>
        </div>
      </div>

      {/* Referral link */}
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase" as const,
            color: "rgba(245,248,252,0.34)",
            marginBottom: 8,
          }}
        >
          Your referral link
        </div>
        {referralUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 6px 6px 15px",
              borderRadius: 99,
              background: "#070b12",
              border: "1px solid rgba(255,255,255,0.11)",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "rgba(245,248,252,0.56)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {referralUrl}
            </span>
            <button style={S.iconBtn} onClick={handleCopy}>
              {copied ? <Check size={14} color="#6EE7B7" /> : <Copy size={14} />}
            </button>
            <button style={S.iconBtn} onClick={handleShareX}>
              <ExternalLink size={14} />
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: "10px 15px",
              borderRadius: 12,
              background: "#070b12",
              border: "1px solid rgba(255,255,255,0.06)",
              fontFamily: "monospace",
              fontSize: 12,
              color: "rgba(245,248,252,0.34)",
              fontStyle: "italic",
            }}
          >
            Syncing referral link…
          </div>
        )}
      </div>

      {/* Email confirmed */}
      {hasEmailCompleted && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(110,231,183,0.08)",
            border: "1px solid rgba(110,231,183,0.2)",
            fontSize: 13,
            color: "#6EE7B7",
          }}
        >
          <Check size={14} />
          Email confirmed: {attachedEmail ?? ""}
        </div>
      )}

      {/* Share CTA */}
      <button
        onClick={handleShareX}
        style={{
          width: "100%",
          padding: "16px 30px",
          fontSize: 15,
          fontWeight: 700,
          background: "linear-gradient(135deg, oklch(0.87 0.12 192), oklch(0.65 0.16 192))",
          color: "oklch(0.18 0.04 192)",
          border: "none",
          borderRadius: 99,
          cursor: "pointer",
          marginTop: 2,
          letterSpacing: "-0.01em",
        }}
      >
        Share on X to climb the queue
      </button>
    </div>
  );
}
