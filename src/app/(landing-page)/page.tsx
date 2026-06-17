"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { useAuthStore } from "@/store/use-auth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, accessCodeRequired } = useAuthStore();
  const { connect, isAuthenticating } = useWallet();

  useEffect(() => {
    if (isAuthenticated && !accessCodeRequired) {
      router.replace("/chat");
    }
  }, [isAuthenticated, accessCodeRequired, router]);

  if (isAuthenticated && !accessCodeRequired) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image
          src="/images/logo.png"
          alt="Tasmil Finance"
          width={64}
          height={64}
          className="mb-1"
        />
        <h1 className="text-2xl font-bold text-white">Tasmil Finance</h1>
        <p className="text-sm text-zinc-400 max-w-xs">
          Access is gated. You need a valid access code to enter the app.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          variant="gradient"
          onClick={() => void connect()}
          disabled={isAuthenticating}
          className="h-auto rounded-full px-16 py-4 text-base"
        >
          {isAuthenticating ? "Connecting..." : "Connect Wallet"}
        </Button>
        <p className="text-xs text-zinc-500">
          Don&apos;t have an access code?{" "}
          <a
            href="https://tasmil-finance.xyz/access"
            className="text-zinc-300 underline underline-offset-2 hover:text-white"
          >
            Enter access code
          </a>
        </p>
      </div>
    </div>
  );
}
