"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useWalletStatus } from "@/features/whitelist/hooks/use-wallet-waitlist";
import { useWallet } from "@/shared/context/wallet-context";
import { ProgressStepper, type Step } from "./ui/stepper";

function MailAnim() {
  return (
    <div className="tw-bell-anim">
      <span className="wa-glow" />
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="oklch(0.87 0.12 192)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          width: 92,
          height: 92,
          position: "relative",
          zIndex: 1,
          overflow: "visible",
          filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.5))",
        }}
      >
        <g className="tw-bell-waves">
          <path className="tw-bw tw-bw-l" d="M30 44 C 24 50 24 64 30 70" />
          <path className="tw-bw tw-bw-r" d="M90 44 C 96 50 96 64 90 70" />
        </g>
        <g className="tw-bell-swing">
          <circle cx="60" cy="26" r="3.4" fill="oklch(0.87 0.12 192)" stroke="none" />
          <path d="M42 78 V52 a18 18 0 0 1 36 0 V78 l4 7 H38 Z" fill="#0B0F18" />
          <circle cx="60" cy="90" r="4.6" fill="oklch(0.87 0.12 192)" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

interface WaitlistScreen2Props {
  onEmailSuccess: (email: string) => void;
  onSkip: () => void;
}

const STEPS: Step[] = [
  { id: "wallet", label: "Connect", state: "done" },
  { id: "email", label: "Email", state: "active" },
  { id: "done", label: "Done", state: "inactive" },
];

export function WaitlistScreen2({ onEmailSuccess, onSkip }: WaitlistScreen2Props) {
  const { address } = useWallet();
  const { refetch: refetchStatus } = useWalletStatus(address);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`waitlist_email_${address}`);
    if (saved) setEmail(saved);
  }, [address]);

  const emailValid = /@/.test(email) && /\./.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const challengeRes = await fetch("/api/waitlist/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address ?? "" }),
      });
      if (!challengeRes.ok) throw new Error("Failed to get challenge");
      const { challenge } = await challengeRes.json();

      const { signMessage } = await import("@stellar/freighter-api");
      const sigResult = await signMessage(challenge, { address: address ?? "" });
      if (sigResult.error || !sigResult.signedMessage) {
        const msg = sigResult.error?.message ?? "";
        if (
          msg.toLowerCase().includes("reject") ||
          msg.toLowerCase().includes("cancel") ||
          msg.toLowerCase().includes("denied")
        ) {
          setIsSubmitting(false);
          return;
        }
        throw new Error(msg || "Wallet signing failed");
      }
      const raw = sigResult.signedMessage;
      const signedChallenge = (() => {
        if (typeof raw !== "string") return Buffer.from(raw as Uint8Array).toString("base64");
        if (raw.startsWith("0x") && raw.length > 2)
          return Buffer.from(raw.slice(2), "hex").toString("base64");
        if (/^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0) {
          const b = Buffer.from(raw, "hex");
          if (b.length > 0) return b.toString("base64");
        }
        if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length % 4 === 0) return raw;
        return Buffer.from(raw, "binary").toString("base64");
      })();

      const res = await fetch("/api/waitlist/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address ?? "",
          email: email.trim().toLowerCase(),
          signedChallenge,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to attach email" }));
        throw new Error(err.message ?? "Failed to attach email");
      }
      refetchStatus();
      onEmailSuccess(email.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  const btnActive = emailValid && !isSubmitting;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <ProgressStepper steps={STEPS} />
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <MailAnim />
        <h3
          style={{
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#F5F8FC",
            margin: 0,
          }}
        >
          Get early-access alerts
        </h3>
        <p
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "rgba(245,248,252,0.56)",
            lineHeight: 1.55,
            maxWidth: 320,
            margin: "8px auto 0",
          }}
        >
          Add your email — we&apos;ll notify you the moment your spot opens.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          disabled={isSubmitting}
          style={{
            fontFamily: "inherit",
            fontSize: 15,
            color: "#F5F8FC",
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${emailValid && email ? "oklch(0.87 0.12 192)" : "rgba(255,255,255,0.11)"}`,
            borderRadius: 14,
            padding: "14px 16px",
            width: "100%",
            boxSizing: "border-box",
            outline: "none",
            boxShadow: emailValid && email ? "0 0 0 4px oklch(0.87 0.12 192 / 0.12)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        <button
          type="submit"
          disabled={!btnActive}
          style={{
            width: "100%",
            padding: "16px 30px",
            fontSize: 15,
            fontWeight: 700,
            background: btnActive
              ? "linear-gradient(108deg, #ffffff 0%, oklch(0.87 0.12 192) 50%, oklch(0.70 0.15 192) 100%)"
              : "rgba(255,255,255,0.06)",
            color: btnActive ? "oklch(0.18 0.04 192)" : "rgba(245,248,252,0.34)",
            border: "none",
            borderRadius: 999,
            cursor: btnActive ? "pointer" : "not-allowed",
            letterSpacing: "-0.01em",
            boxShadow: btnActive
              ? "0 1px 0 rgba(255,255,255,0.4) inset, 0 10px 30px -12px oklch(0.84 0.13 192 / 0.55)"
              : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Notify me <span style={{ marginLeft: 2 }}>→</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: "#FB7185", textAlign: "center" }}>{error}</p>
      )}

      <button
        type="button"
        onClick={onSkip}
        style={{
          marginTop: 14,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          color: "rgba(245,248,252,0.34)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          padding: 0,
          alignSelf: "center",
        }}
      >
        Skip for now
      </button>
    </div>
  );
}
