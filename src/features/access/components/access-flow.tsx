"use client";

import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRedeemCode } from "@/features/access/hooks/use-access-code";
import {
  KeyAnim,
  PopperAnim,
  ScanAnim,
  WalletAnim,
} from "@/features/landing/components/animations/svg-anims";
import { Stepper } from "@/features/landing/components/ui/stepper";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Screen = "connect" | "verify" | "code" | "done";

interface RedeemResult {
  id: string;
  seatNumber?: number;
  walletAddress: string;
  redeemedAt: string;
}

export function AccessFlow() {
  const { address, connect, displayAddress, isAuthenticating } = useWallet();
  const [screen, setScreen] = useState<Screen>("connect");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const redeemCode = useRedeemCode();

  const stepIndex = screen === "connect" || screen === "verify" ? 0 : screen === "code" ? 1 : 2;

  async function handleConnect() {
    await connect();
    setScreen("verify");
    setTimeout(() => setScreen("code"), 1400);
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !address) return;
    setCodeError(false);
    try {
      const r = await redeemCode.mutateAsync({ walletAddress: address, code: code.trim() });
      setResult(r);
      setScreen("done");
    } catch {
      setCodeError(true);
      if (inputRef.current) {
        inputRef.current.classList.remove("shake");
        void inputRef.current.offsetWidth;
        inputRef.current.classList.add("shake");
      }
    }
  }

  function copyReferral() {
    if (!address) return;
    const url = `${window.location.origin}/waitlist?ref=${address.slice(0, 6)}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  return (
    <div className="board">
      <div className="board-body">
        <Stepper steps={["Wallet", "Code", "Done"]} currentIndex={stepIndex} />

        {screen === "connect" && (
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
              Connect to redeem
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
              Your access code binds to this wallet. Connect first, then enter your code.
            </p>
            <Button
              variant="gradient"
              className="w-full mt-4 h-12 text-[15px]"
              onClick={handleConnect}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-[15px] h-[15px] animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect Stellar Wallet"
              )}
            </Button>
          </div>
        )}

        {screen === "verify" && (
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <ScanAnim />
            <h3
              style={{
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#F5F8FC",
                margin: 0,
              }}
            >
              Checking the registry…
            </h3>
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "rgba(245,248,252,0.56)",
                lineHeight: 1.55,
              }}
            >
              Verifying wallet ownership and looking up your access record.
            </p>
          </div>
        )}

        {screen === "code" && (
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <KeyAnim />
            <h3
              style={{
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#F5F8FC",
                margin: 0,
              }}
            >
              Enter your access code
            </h3>
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "rgba(245,248,252,0.56)",
                lineHeight: 1.55,
              }}
            >
              Bound to{" "}
              <span style={{ fontFamily: "monospace", color: "#F5F8FC" }}>{displayAddress}</span> —
              paste the code from your invite.
            </p>
            <form onSubmit={handleRedeem} style={{ marginTop: 20 }}>
              <Input
                ref={inputRef}
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) setCodeError(false);
                }}
                maxLength={24}
                autoFocus
                className={`font-mono text-base tracking-[0.08em] text-center rounded-[14px] py-3.5 px-4 focus-visible:ring-0 focus-visible:ring-offset-0 transition-[border-color,box-shadow] duration-200 ${
                  codeError ? "border-[#FB7185] shadow-[0_0_0_4px_rgba(251,113,133,0.15)]" : ""
                }`}
              />
              {codeError && (
                <p style={{ marginTop: 6, fontSize: 12, color: "#FB7185" }}>
                  That code isn&apos;t valid. Check it and try again.
                </p>
              )}
              <Button
                variant="gradient"
                type="submit"
                className="w-full mt-4 h-12 text-[15px]"
                disabled={!code.trim() || redeemCode.isPending}
              >
                {redeemCode.isPending ? (
                  <>
                    <Loader2 className="w-[15px] h-[15px] animate-spin" />
                    Redeeming…
                  </>
                ) : (
                  <>
                    Redeem &amp; claim seat <span>→</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {screen === "done" && (
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <PopperAnim />
            <h3
              style={{
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#F5F8FC",
                margin: 0,
              }}
            >
              Access granted
            </h3>
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "rgba(245,248,252,0.56)",
                lineHeight: 1.55,
              }}
            >
              Welcome to Tasmil — your seat is secured.
            </p>

            <div
              style={{
                marginTop: 20,
                borderRadius: 16,
                border: "1px solid oklch(0.87 0.12 192 / 0.35)",
                background:
                  "linear-gradient(135deg, rgba(103,232,249,0.06) 0%, rgba(10,14,22,0.96) 100%)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(245,248,252,0.34)",
                  }}
                >
                  Your seat
                </span>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "#F5F8FC",
                    lineHeight: 1,
                  }}
                >
                  {result?.seatNumber != null ? `#${result.seatNumber}` : "#—"}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(245,248,252,0.45)",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Early cohort
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 12, color: "oklch(0.87 0.12 192)", fontWeight: 600 }}>
                  ✓ Verified
                </span>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "rgba(245,248,252,0.45)",
                    marginTop: 4,
                  }}
                >
                  {displayAddress}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4 h-12 text-[15px] bg-white/[0.06] hover:bg-white/[0.1] text-[#F5F8FC]"
              onClick={copyReferral}
            >
              Copy invite link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
