"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import {
  useRegisterWallet,
  useRequestChallenge,
  useWalletStatus,
} from "@/features/whitelist/hooks/use-wallet-waitlist";
import { useWallet } from "@/shared/context/wallet-context";
import { ProgressStepper, type Step } from "./ui/stepper";

function WalletAnim() {
  return (
    <div className="tw-wallet-anim">
      <span className="wa-glow" />
      <svg
        viewBox="0 0 120 120"
        fill="none"
        style={{ width: 96, height: 96, position: "relative", zIndex: 1, overflow: "visible" }}
      >
        <defs>
          <linearGradient
            id="wa-card-grad"
            x1="34"
            y1="22"
            x2="86"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="oklch(0.87 0.12 192)" />
          </linearGradient>
          <clipPath id="wa-clip">
            <rect x="20" y="20" width="80" height="46" rx="6" />
          </clipPath>
        </defs>
        <g clipPath="url(#wa-clip)">
          <g className="tw-wa-card">
            <rect x="38" y="18" width="44" height="29" rx="6" fill="url(#wa-card-grad)" />
            <rect x="44" y="36" width="15" height="3" rx="1.5" fill="rgba(0,0,0,0.32)" />
            <circle cx="74" cy="26" r="3.4" fill="rgba(0,0,0,0.22)" />
          </g>
        </g>
        <g
          style={{ filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.55))" }}
          stroke="oklch(0.87 0.12 192)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="26" y="50" width="68" height="46" rx="13" fill="#0B0F18" />
          <path d="M26 64 H94" />
          <circle cx="80" cy="80" r="4.2" fill="oklch(0.87 0.12 192)" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

interface WaitlistScreen1Props {
  referredByCode?: string | null;
  onJoined?: () => void;
}

const STEPS: Step[] = [
  { id: "wallet", label: "Connect", state: "active" },
  { id: "email", label: "Email", state: "inactive" },
  { id: "done", label: "Done", state: "inactive" },
];

export function WaitlistScreen1({ referredByCode, onJoined }: WaitlistScreen1Props) {
  const { isConnected, address, connect, displayAddress, isAuthenticating } = useWallet();
  const queryClient = useQueryClient();
  const requestChallenge = useRequestChallenge();
  const registerWallet = useRegisterWallet();
  const { data: walletStatus } = useWalletStatus(address);

  // Reset mutation state when address changes
  useEffect(() => {
    registerWallet.reset();
  }, [registerWallet]);

  const handleRegister = useCallback(async () => {
    if (!address) return;
    const challengeResult = await requestChallenge.mutateAsync({ walletAddress: address });

    // Sign the challenge with Freighter wallet
    const { signMessage } = await import("@stellar/freighter-api");
    const sigResult = await signMessage(challengeResult.challenge, { address });
    if (sigResult.error || !sigResult.signedMessage) {
      const msg = sigResult.error?.message ?? "";
      if (
        msg.toLowerCase().includes("reject") ||
        msg.toLowerCase().includes("cancel") ||
        msg.toLowerCase().includes("denied")
      ) {
        return;
      }
      throw new Error(msg || "Wallet signing failed");
    }
    const raw = sigResult.signedMessage;
    console.warn("[waitlist] signedMessage:", typeof raw, JSON.stringify(raw)?.slice(0, 80));

    const signedChallenge = (() => {
      if (!raw) return "";
      // Buffer / Uint8Array
      if (typeof raw !== "string") {
        const buf = Buffer.from(raw as Uint8Array);
        return buf.length > 0 ? buf.toString("base64") : "";
      }
      if (raw.length === 0) return "";
      // 0x-prefixed hex
      if (raw.startsWith("0x") && raw.length > 2) {
        return Buffer.from(raw.slice(2), "hex").toString("base64");
      }
      // Valid hex (even-length)
      if (/^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0) {
        const fromHex = Buffer.from(raw, "hex");
        if (fromHex.length > 0) return fromHex.toString("base64");
      }
      // Already looks like base64
      if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length % 4 === 0) return raw;
      // Last resort: binary string → base64
      return Buffer.from(raw, "binary").toString("base64");
    })();

    if (!signedChallenge) {
      console.warn("[waitlist] signedChallenge is empty, raw was:", raw);
      throw new Error("Wallet signing produced empty result. Please try again.");
    }

    const payload: Parameters<typeof registerWallet.mutateAsync>[0] = {
      walletAddress: address,
      walletProvider: "FREIGHTER",
      signedChallenge,
      source: "whitelist_page",
    };
    if (referredByCode) payload.referredByCode = referredByCode;

    const result = await registerWallet.mutateAsync(payload);

    // Prefill status cache so the next screen shows instantly
    queryClient.setQueryData(["waitlist", "status", address], {
      id: result.id,
      walletAddress: address,
      referralCode: result.referralCode,
      queueRank: null,
      totalEntries: null,
      successfulReferralCount: 0,
      referredByCode: referredByCode ?? null,
      createdAt: new Date().toISOString(),
      hasEmail: false,
      emailDeliveryEligible: false,
    });
    // Notify parent so it marks this session as joined (prevents loop-back
    // to Screen 1 if the background status refetch later fails).
    onJoined?.();
    // Background refetch to get real queue rank — fire-and-forget, no await.
    queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
  }, [
    address,
    requestChallenge,
    registerWallet,
    referredByCode,
    queryClient, // Notify parent so it marks this session as joined (prevents loop-back
    // to Screen 1 if the background status refetch later fails).
    onJoined,
  ]);

  const isPending = requestChallenge.isPending || registerWallet.isPending;

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px 30px",
    fontSize: 15,
    fontWeight: 700,
    background:
      "linear-gradient(108deg, #ffffff 0%, oklch(0.87 0.12 192) 50%, oklch(0.70 0.15 192) 100%)",
    color: "oklch(0.18 0.04 192)",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    marginTop: 22,
    letterSpacing: "-0.01em",
    boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 10px 30px -12px oklch(0.84 0.13 192 / 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  if (!isConnected || !address) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <ProgressStepper steps={STEPS} />
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <WalletAnim />
          <h3
            style={{
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#F5F8FC",
              margin: 0,
            }}
          >
            Connect your wallet
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
            Join the Tasmil waitlist with your Stellar wallet — claim your place in the queue.
          </p>
          <button
            style={
              isAuthenticating ? { ...btnStyle, opacity: 0.5, cursor: "not-allowed" } : btnStyle
            }
            onClick={connect}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <>
                <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                Connecting…
              </>
            ) : (
              "Connect Stellar Wallet"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <ProgressStepper steps={STEPS} />
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <WalletAnim />
        <h3
          style={{
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#F5F8FC",
            margin: 0,
          }}
        >
          Connect your wallet
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
          Connected as{" "}
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#F5F8FC",
            }}
          >
            {displayAddress}
          </span>
          . Sign to join.
        </p>

        {referredByCode && (
          <p style={{ marginTop: 6, fontSize: 12, color: "oklch(0.87 0.12 192)" }}>
            Referred by <span style={{ fontFamily: "monospace" }}>{referredByCode}</span>
          </p>
        )}

        {isPending ? (
          <button style={{ ...btnStyle, opacity: 0.5, cursor: "not-allowed" }} disabled>
            <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
            {requestChallenge.isPending ? "Preparing…" : "Registering…"}
          </button>
        ) : (
          <button
            style={
              isAuthenticating || !!walletStatus
                ? { ...btnStyle, opacity: 0.5, cursor: "not-allowed" }
                : btnStyle
            }
            onClick={handleRegister}
            disabled={isAuthenticating || !!walletStatus}
          >
            {registerWallet.isError
              ? "Try again — Join waitlist"
              : "Join waitlist with this wallet"}
          </button>
        )}

        {registerWallet.isError && (
          <p style={{ marginTop: 8, fontSize: 12, color: "#FB7185" }}>
            {registerWallet.error?.message ?? "Registration failed. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
}
