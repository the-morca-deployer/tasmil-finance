"use client";

import { CheckCircle, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";

interface Props {
  onConnected: () => void;
}

export function StepConnect({ onConnected }: Props) {
  const { isConnected, connect } = useWallet();

  useEffect(() => {
    if (isConnected) onConnected();
  }, [isConnected, onConnected]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 text-center">
      <Image src="/images/logo.png" width={48} height={48} alt="Tasmil logo" priority />
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Get started</h1>
        <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
          Connect your wallet to set up a Smart Account that lets Tasmil rebalance your funds across
          audited yield pools.
        </p>
      </div>
      <Button
        size="lg"
        variant="outline"
        onClick={() => void connect()}
        className="h-12 rounded-full px-8 text-sm"
      >
        Connect Wallet
      </Button>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-emerald-400" /> Self-custody
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3 text-emerald-400" /> Revokable any time
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-emerald-400" /> Session-key automation
        </span>
      </div>
    </div>
  );
}
