// @ts-nocheck
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { PopperAnim } from "@/features/landing/components/animations/svg-anims";

import { Stepper } from "@/features/landing/components/ui/stepper";
import { useWalletStatus } from "@/features/waitlist/hooks/use-wallet-waitlist";
import { fireConfettiBurst } from "@/features/waitlist/lib/confetti-burst";
import {
  buildReferralUrl,
  buildXShareText,
  copyToClipboard,
  openXShare,
} from "@/features/waitlist/lib/share-to-x";
import { useWallet } from "@/shared/context/wallet-context";

const CLIMB_STEPS = [
  { name: "Unranked", gate: "0", threshold: 0 },
  { name: "Cohort 4", gate: "1", threshold: 1 },
  { name: "Cohort 3", gate: "10", threshold: 10 },
  { name: "Cohort 2", gate: "30", threshold: 30 },
  { name: "Founding", gate: "50+", threshold: 50 },
];

const MILESTONE_BONUS: Record<number, number> = { 1: 100, 10: 300, 30: 700, 50: 1500 };

function getClimbState(refCount: number) {
  let doneIdx = 0;
  for (let i = CLIMB_STEPS.length - 1; i >= 0; i--) {
    if (refCount >= CLIMB_STEPS[i].threshold) {
      doneIdx = i;
      break;
    }
  }
  const nextIdx = doneIdx < CLIMB_STEPS.length - 1 ? doneIdx + 1 : null;
  const progressWidth = Math.min(80, doneIdx * 20 + 20);
  const pts =
    refCount * 50 +
    [1, 10, 30, 50].filter((m) => refCount >= m).reduce((s, m) => s + MILESTONE_BONUS[m], 0);
  return { doneIdx, nextIdx, progressWidth, pts };
}

interface WaitlistScreen3Props {
  submittedEmail: string | null;
}

export function WaitlistScreen3({ submittedEmail }: WaitlistScreen3Props) {
  const { address, displayAddress } = useWallet();
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useWalletStatus(address);
  const [copied, setCopied] = useState(false);
  const [attachedEmail, setAttachedEmail] = useState<string | null>(submittedEmail);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`waitlist_email_${address}`);
    if (saved) setAttachedEmail(saved);
  }, [address]);

  useEffect(() => {
    if (!submittedEmail || !address) return;
    setAttachedEmail(submittedEmail);
    localStorage.setItem(`waitlist_email_${address}`, submittedEmail);
    setDialogOpen(true);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
    }, 300);
  }, [submittedEmail, address, queryClient]);

  const hasEmailCompleted = !!(status?.hasEmail || attachedEmail);
  const currentIndex = hasEmailCompleted ? 3 : 2;
  const referralUrl = buildReferralUrl(status?.referralCode) ?? null;
  const refCount = status?.successfulReferralCount ?? 0;
  const { doneIdx, nextIdx, progressWidth, pts } = getClimbState(refCount);
  const nextStep = nextIdx !== null ? CLIMB_STEPS[nextIdx] : null;
  const neededForNext = nextStep ? nextStep.threshold - refCount : 0;

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 0",
        }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: 24, height: 24, color: "rgba(245,248,252,0.4)" }}
        />
      </div>
    );
  }

  return (
    <>
      {dialogOpen && <AccessGrantedDialog onClose={() => setDialogOpen(false)} />}

      <div className="screen">
        <Stepper steps={["Connect", "Email", "Done"]} currentIndex={currentIndex} />

        <div className="done-head">
          <PopperAnim />
          <h3 className="screen-h">You&apos;re on the list</h3>
          <p className="screen-p" style={{ marginTop: 4 }}>
            Registered with{" "}
            <span className="mono" style={{ color: "var(--text)" }}>
              {displayAddress}
            </span>
          </p>
        </div>

        <div className="stat-duo" style={{ marginTop: 16 }}>
          <div className="stat-box">
            <div className="lbl">Queue rank</div>
            <div className="val">
              {status?.queueRank != null ? `#${status.queueRank.toLocaleString()}` : "-"}
            </div>
            <div className="sub">
              {status?.totalEntries != null
                ? `of ${status.totalEntries.toLocaleString()} joined`
                : "Your position"}
            </div>
          </div>
          <div className="stat-box">
            <div className="lbl">Referrals</div>
            <div className="val">{refCount}</div>
            <div className="sub">
              {refCount > 0 ? `${pts.toLocaleString()} pts total` : "Invite to climb"}
            </div>
          </div>
        </div>

        <div className="climb">
          <div className="climb-head">
            <div className="climb-cell">
              <span className="cl-lbl">Cohort</span>
              <span className="cl-val">{CLIMB_STEPS[doneIdx].name}</span>
            </div>
            <div className="climb-cell right">
              <span className="cl-lbl">Ref Points</span>
              <span className="cl-val">{pts.toLocaleString()}</span>
            </div>
          </div>

          <div
            className="climb-steps"
            style={{ "--climb-progress": `${progressWidth}%` } as React.CSSProperties}
          >
            {CLIMB_STEPS.map((s, i) => {
              const isDone = i <= doneIdx;
              const isNext = i === nextIdx;
              return (
                <div
                  key={i}
                  className={["cstep", isDone ? "done" : "", isNext ? "next" : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="cdot" />
                  <span className="cgate">{s.gate}</span>
                  <span className="cname">{s.name}</span>
                </div>
              );
            })}
          </div>

          <div className="climb-foot">
            {nextStep ? (
              <span className="climb-invite">
                Invite{" "}
                <b>
                  {neededForNext} {neededForNext === 1 ? "friend" : "friends"}
                </b>{" "}
                to enter {nextStep.name}
              </span>
            ) : (
              <span className="climb-invite">★ Founding member · highest tier reached</span>
            )}
            <a className="climb-learn" href="#how">
              New here? See how it works <span className="arr">→</span>
            </a>
          </div>
        </div>

        {referralUrl ? (
          <div className="ref-link" style={{ marginTop: 12 }}>
            <span className="url">{referralUrl}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} color="#67E8F9" /> : <Copy size={14} />} Copy
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              padding: "10px 15px",
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid var(--line-2)",
              fontFamily: "monospace",
              fontSize: 12,
              color: "rgba(245,248,252,0.34)",
              fontStyle: "italic",
            }}
          >
            Syncing referral link...
          </div>
        )}

        <button
          onClick={handleShareX}
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 14 }}
        >
          Share on X to climb the queue
        </button>

        {hasEmailCompleted && (
          <p className="email-mini">
            <Check size={13} /> Access code sent. Check your inbox.
          </p>
        )}
      </div>
    </>
  );
}

interface AccessGrantedDialogProps {
  onClose: () => void;
}

function AccessGrantedDialog({ onClose }: AccessGrantedDialogProps) {
  useEffect(() => {
    const el = document.querySelector("[data-access-dialog]") as HTMLElement | null;
    if (el) fireConfettiBurst(el);
  }, []);

  const checkItem = (text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "rgba(103,232,249,0.12)",
          border: "1px solid rgba(103,232,249,0.35)",
          color: "#67E8F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        ✓
      </div>
      <span style={{ fontSize: 14, color: "rgba(244,247,251,0.7)" }}>{text}</span>
    </div>
  );

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        data-access-dialog
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#07090F",
          border: "1px solid rgba(103,232,249,0.28)",
          borderRadius: 26,
          padding: "36px 32px 32px",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0 0 0 1px rgba(103,232,249,0.06), 0 32px 80px -20px rgba(0,0,0,0.9), 0 0 60px -20px rgba(103,232,249,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 140,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(103,232,249,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(244,247,251,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          <X size={13} />
        </button>

        {/* Animation */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
          <PopperAnim />
        </div>

        {/* Badge */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#67E8F9",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          ✦ Early Access Granted
        </p>

        {/* Title */}
        <p
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#F4F7FB",
            lineHeight: 1.2,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          You&apos;re one of the{" "}
          <span
            style={{
              background: "linear-gradient(100deg, #A5F3FC 0%, #67E8F9 50%, #0EA5E9 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            chosen few
          </span>
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 14.5,
            color: "rgba(244,247,251,0.52)",
            lineHeight: 1.65,
            textAlign: "center",
            marginBottom: 22,
            maxWidth: 320,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Your access code is on its way to your inbox. Start using Tasmil Finance right now.
        </p>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(103,232,249,0.25), transparent)",
            marginBottom: 20,
          }}
        />

        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {checkItem("Access code sent to your email")}
          {checkItem("Instant access. No waiting required.")}
          {checkItem("Invite friends to climb the waitlist faster")}
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "15px 0",
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(110deg, #0EA5E9 0%, #67E8F9 60%, #A5F3FC 100%)",
            color: "#000D14",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            cursor: "pointer",
            boxShadow: "0 8px 28px -8px rgba(103,232,249,0.5)",
          }}
        >
          Got it, check my inbox →
        </button>
      </div>
    </div>,
    document.body
  );
}
