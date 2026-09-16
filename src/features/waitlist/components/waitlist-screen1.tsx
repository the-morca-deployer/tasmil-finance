"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { WalletAnim } from "@/features/landing/components/animations/svg-anims";
import { Stepper } from "@/features/landing/components/ui/stepper";
import { useRegisterWallet, useWalletStatus } from "@/features/waitlist/hooks/use-wallet-waitlist";
import { useWallet } from "@/shared/context/wallet-context";

const STEPS = ["Connect", "Email", "Done"];

interface WaitlistScreen1Props {
  referredByCode?: string | null;
  onJoined?: () => void;
}

export function WaitlistScreen1({ referredByCode, onJoined }: WaitlistScreen1Props) {
  const { isConnected, address, connect, displayAddress, isAuthenticating } = useWallet();
  const queryClient = useQueryClient();
  const registerWallet = useRegisterWallet();
  const { data: walletStatus } = useWalletStatus(address);
  const pendingAutoJoin = useRef(false);

  useEffect(() => {
    registerWallet.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleRegister = useCallback(async () => {
    if (!address) return;

    const payload: Parameters<typeof registerWallet.mutateAsync>[0] = {
      walletAddress: address,
      walletProvider: "FREIGHTER",
      signedChallenge: "",
      source: "whitelist_page",
    };
    if (referredByCode) payload.referredByCode = referredByCode;

    const result = await registerWallet.mutateAsync(payload);

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
    onJoined?.();
    queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
  }, [address, registerWallet, referredByCode, queryClient, onJoined]);

  // Auto-join right after wallet connects
  useEffect(() => {
    if (
      isConnected &&
      address &&
      pendingAutoJoin.current &&
      !registerWallet.isPending &&
      !walletStatus
    ) {
      pendingAutoJoin.current = false;
      handleRegister();
    }
  }, [isConnected, address, registerWallet.isPending, walletStatus, handleRegister]);

  const handleConnect = useCallback(() => {
    pendingAutoJoin.current = true;
    connect();
  }, [connect]);

  if (!isConnected || !address) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Stepper steps={STEPS} currentIndex={0} />
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
            Connect your Stellar wallet to join the Tasmil waitlist.
          </p>
          <button
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: 22 }}
            onClick={handleConnect}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <>
                <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect & Join Waitlist"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Stepper steps={STEPS} currentIndex={0} />
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
          Join Waitlist
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
        </p>

        {referredByCode && (
          <p style={{ marginTop: 6, fontSize: 12, color: "var(--accent)" }}>
            Referred by <span style={{ fontFamily: "monospace" }}>{referredByCode}</span>
          </p>
        )}

        {registerWallet.isPending ? (
          <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 22 }} disabled>
            <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
            Registering...
          </button>
        ) : (
          <button
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: 22 }}
            onClick={handleRegister}
            disabled={!!walletStatus}
          >
            {registerWallet.isError ? "Try again" : "Join Waitlist"}
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
