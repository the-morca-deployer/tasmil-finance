// @ts-nocheck
"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Stepper } from "@/features/landing/components/ui/stepper";
import {
  useAttachWaitlistContact,
  useWalletStatus,
} from "@/features/waitlist/hooks/use-wallet-waitlist";
import { useWallet } from "@/shared/context/wallet-context";

interface WaitlistScreen2Props {
  onEmailSuccess: (email: string) => void;
  onSkip: () => void;
}

export function WaitlistScreen2({ onEmailSuccess, onSkip }: WaitlistScreen2Props) {
  const { address } = useWallet();
  const { refetch: refetchStatus } = useWalletStatus(address);
  const attachContact = useAttachWaitlistContact();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`waitlist_email_${address}`);
    if (saved) setEmail(saved);
  }, [address]);

  const emailValid = /@/.test(email) && /\./.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || attachContact.isPending) return;
    setError(null);
    try {
      await attachContact.mutateAsync({
        walletAddress: address ?? "",
        email: email.trim().toLowerCase(),
      });
      localStorage.setItem(`waitlist_email_${address}`, email.trim().toLowerCase());
      refetchStatus();
      onEmailSuccess(email.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Stepper steps={["Connect", "Email", "Done"]} currentIndex={1} />
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <KeyRound size={24} color="#a5b4fc" />
        </div>
        <p
          style={{
            marginTop: 14,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#818cf8",
          }}
        >
          ✦ You&apos;ve been selected
        </p>
        <h3
          style={{
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#F5F8FC",
            margin: "4px 0 0",
          }}
        >
          Get your access code now
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
          Enter your email to receive an exclusive access code. Start using Tasmil Finance
          immediately.
        </p>
        <p
          style={{
            marginTop: 8,
            fontSize: 10.5,
            fontWeight: 600,
            color: "#6EE7B7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#6EE7B7",
              flexShrink: 0,
            }}
          />
          Instant access. No waiting.
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
          disabled={attachContact.isPending}
          className="field"
        />
        <button
          type="submit"
          disabled={!emailValid || attachContact.isPending}
          className="btn btn-primary btn-block btn-lg"
        >
          {attachContact.isPending ? (
            <>
              <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>Send my Access Code →</>
          )}
        </button>
      </form>
      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: "#FB7185", textAlign: "center" }}>{error}</p>
      )}
    </div>
  );
}
