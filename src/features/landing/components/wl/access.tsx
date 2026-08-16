// @ts-nocheck
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { BeamsBg, Ico, KeyAnim, PopperAnim, Stepper, WalletAnim } from "./shared";

/* -- Segmented 12-character code input (3 × 4 boxes) -- */
function CodeInput({ value, onChange, hasError }) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const chars = (value + "").padEnd(8, " ").split("").slice(0, 8);

  const handleChange = (e) => {
    const v = e.target.value
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8);
    onChange(v);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8);
    onChange(pasted);
  };

  const boxStyle = (idx) => {
    const char = chars[idx].trim();
    const isNext = focused && idx === value.length;
    return {
      width: 36,
      height: 46,
      borderRadius: 8,
      border: `1.5px solid ${
        hasError
          ? "#FB7185"
          : isNext
            ? "var(--accent)"
            : char
              ? "rgba(255,255,255,0.22)"
              : "rgba(255,255,255,0.09)"
      }`,
      background: "#070b12",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-mono)",
      fontSize: 17,
      fontWeight: 700,
      color: "#F5F8FC",
      transition: "border-color 0.15s",
      boxShadow: isNext ? "0 0 0 3px oklch(0.87 0.12 192 / 0.18)" : "none",
      userSelect: "none",
    };
  };

  return (
    <div style={{ position: "relative", cursor: "text" }} onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={8}
        autoFocus
        aria-label="Access code"
        style={{
          position: "absolute",
          opacity: 0,
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          cursor: "text",
          zIndex: 1,
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
        {[0, 1].map((group) => (
          <React.Fragment key={group}>
            {group > 0 && (
              <span
                style={{
                  color: "var(--dim)",
                  fontSize: 18,
                  fontWeight: 300,
                  userSelect: "none",
                  lineHeight: 1,
                }}
              >
                -
              </span>
            )}
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3].map((pos) => {
                const idx = group * 4 + pos;
                return (
                  <div key={pos} style={boxStyle(idx)}>
                    {chars[idx].trim()}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function loadRedemptionResult(walletAddress: string) {
  try {
    const stored = localStorage.getItem(`tasmil_access:${walletAddress}`);
    return stored ? JSON.parse(stored) : null;
  } catch {}
  return null;
}

function saveRedemptionResult(walletAddress: string, data: unknown) {
  try {
    localStorage.setItem(`tasmil_access:${walletAddress}`, JSON.stringify(data));
  } catch {}
}

async function checkAlreadyRedeemed(walletAddress: string): Promise<boolean> {
  const saved = loadRedemptionResult(walletAddress);
  if (saved) return true;

  try {
    const res = await fetch("/api/waitlist/auth-status");
    if (!res.ok) return false;
    const data = await res.json();
    if (data.authenticated && data.walletAddress === walletAddress) {
      saveRedemptionResult(walletAddress, { redeemed: true });
      return true;
    }
  } catch {}
  return false;
}

/* -- Access flow -- */
function AccessFlow() {
  const { isConnected, address, connect, displayAddress, isAuthenticating, disconnect } =
    useWallet();
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState("wallet");
  const [code, setCode] = useState(
    () =>
      searchParams
        .get("code")
        ?.replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8) ?? ""
  );
  const [err, setErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isConnected || !address) {
      if (!initialized.current) {
        initialized.current = true;
        setScreen("wallet");
      }
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    checkAlreadyRedeemed(address).then((redeemed) => {
      if (redeemed) {
        setResult(loadRedemptionResult(address));
        setScreen("done");
      } else {
        setScreen("code");
      }
    });
  }, [isConnected, address]);

  useEffect(() => {
    if (!isConnected || !address || screen !== "wallet") return;

    checkAlreadyRedeemed(address).then((redeemed) => {
      if (redeemed) {
        setResult(loadRedemptionResult(address));
        setScreen("done");
      } else {
        setScreen("code");
      }
    });
  }, [isConnected, address, screen]);

  const stepIdx = screen === "wallet" ? 0 : screen === "code" ? 1 : 2;

  async function handleSubmit(e) {
    e.preventDefault();
    if (code.length < 8 || submitting) return;
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), walletAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = (data.data ?? data)?.message ?? data.message ?? "Invalid access code.";
        setErr(msg);
        toast.error("Code invalid", { description: msg });
      } else {
        const resultData = data.data ?? data;
        setResult(resultData);
        saveRedemptionResult(address, resultData);
        setScreen("done");
        toast.success("Access granted! Welcome to Tasmil.");
      }
    } catch {
      const msg = "Something went wrong. Please try again.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const referralUrl =
    result?.referralCode && typeof window !== "undefined"
      ? `${window.location.origin}/waitlist?ref=${result.referralCode}`
      : null;

  async function handleCopy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Failed to copy link.");
    }
  }

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
        <Stepper steps={["Wallet", "Code", "Done"]} idx={stepIdx} />

        {screen === "wallet" && (
          <div className="screen" key="w">
            <WalletAnim />
            <h3 className="screen-h">Connect to redeem</h3>
            <p className="screen-p">
              Your access code binds to this wallet. Connect first, then enter your code.
            </p>
            <Button
              gradient
              className="btn-block btn-lg"
              style={{ marginTop: 22 }}
              onClick={connect}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <span className="spinner" />
                  Connecting...
                </>
              ) : (
                "Connect Stellar Wallet"
              )}
            </Button>
          </div>
        )}

        {screen === "code" && (
          <div className="screen" key="k">
            <KeyAnim />
            <h3 className="screen-h">Enter your access code</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              <CodeInput
                value={code}
                onChange={(v) => {
                  setCode(v);
                  if (err) setErr(null);
                }}
                hasError={!!err}
              />
              {err && (
                <div className="err-msg" style={{ marginTop: 10 }}>
                  {Ico.shield({ s: 14 })} {err}
                </div>
              )}
              <Button
                gradient
                type="submit"
                className="btn-block btn-lg"
                style={{ marginTop: 16 }}
                disabled={code.length < 8 || submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Redeem &amp; claim seat <span className="arr">→</span>
                  </>
                )}
              </Button>
            </form>
            {!isConnected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                style={{ marginTop: 12, display: "block", margin: "12px auto 0" }}
                onClick={connect}
              >
                Connect wallet first
              </Button>
            )}
          </div>
        )}

        {screen === "done" && (
          <div className="screen" key="d">
            <PopperAnim />
            <h3 className="screen-h">Access granted</h3>
            <p className="screen-p">Welcome to Tasmil - your seat is secured.</p>

            <div className="seat-pass">
              <div className="sp-glow" />
              <div className="sp-left">
                <span className="sp-label">Your seat</span>
                <span className="sp-num">
                  {result?.seatNumber != null ? `#${result.seatNumber}` : "-"}
                </span>
                <span className="sp-cohort">Early cohort</span>
              </div>
              <div className="sp-perf" />
              <div className="sp-right">
                <span className="sp-verified">{Ico.shield({ s: 14 })} Verified</span>
                <span className="sp-addr mono">{displayAddress}</span>
              </div>
            </div>

            {referralUrl && (
              <div className="ref-link" style={{ marginTop: 14 }}>
                <span className="url">{referralUrl}</span>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {Ico.copy({ s: 14 })} Copy
                </Button>
              </div>
            )}

            <Button
              gradient
              className="btn-block btn-lg"
              style={{ marginTop: 14 }}
              onClick={() => {
                window.location.href = "https://tasmil.finance";
              }}
            >
              Enter dashboard <span className="arr">→</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AccessPage({ accent, motion, homeHref }) {
  return (
    <section className="access-stage">
      <BeamsBg accent={accent} enabled={motion} />
      <div className="hero-veil" />
      <div className="hero-fade" />
      <div className="wrap access-grid">
        <div className="access-copy">
          <span className="eyebrow">Gated access</span>
          <h1 className="access-title">
            Enter your
            <br />
            access code
          </h1>
          <p className="access-desc">
            Invite-only private beta. Redeem your code to unlock AI-managed yield vaults on Stellar.
          </p>
          <Link className="back-link" href={homeHref}>
            <span className="arr">←</span> Back to waitlist
          </Link>
        </div>
        <div className="hero-board-col">
          <AccessFlow />
        </div>
      </div>
    </section>
  );
}

export { AccessFlow, AccessPage };
