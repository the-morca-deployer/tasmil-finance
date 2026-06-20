"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useWalletStatus } from "@/features/waitlist/hooks/use-wallet-waitlist";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { WaitlistScreen1 } from "./waitlist-screen1";
import { WaitlistScreen2 } from "./waitlist-screen2";
import { WaitlistScreen3 } from "./waitlist-screen3";

interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}

export function WaitlistPhaseBoard({ referredByCode }: WaitlistPhaseBoardProps) {
  const { isConnected, address, displayAddress, disconnect } = useWallet();
  const {
    data: walletStatus,
    isLoading: isStatusLoading,
    isError: isStatusError,
  } = useWalletStatus(address);
  const [skipped, setSkipped] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  const isRegistered = !!walletStatus || hasJoined;
  const hasEmail = !!(walletStatus?.hasEmail || submittedEmail);
  const showLoadingSpinner = isConnected && !!address && isStatusLoading && !isStatusError;
  const showScreen: 1 | 2 | 3 = !isConnected || !isRegistered ? 1 : !hasEmail && !skipped ? 2 : 3;

  return (
    <div className="board">
      {isConnected && address && (
        <div className="board-head">
          <span className="board-addr">{displayAddress}</span>
          <Button className="btn btn-ghost" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      )}
      <div className="board-body">
        {showLoadingSpinner ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 0",
            }}
          >
            <Loader2
              className="animate-spin"
              style={{ width: 24, height: 24, color: "rgba(245,248,252,0.4)" }}
            />
          </div>
        ) : (
          <>
            {showScreen === 1 && (
              <WaitlistScreen1
                referredByCode={referredByCode}
                onJoined={() => setHasJoined(true)}
              />
            )}
            {showScreen === 2 && (
              <WaitlistScreen2
                onEmailSuccess={(email) => setSubmittedEmail(email)}
                onSkip={() => setSkipped(true)}
              />
            )}
            {showScreen === 3 && <WaitlistScreen3 submittedEmail={submittedEmail} />}
          </>
        )}
      </div>
    </div>
  );
}
