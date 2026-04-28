"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth";
import { useTopupSnapshot } from "../hooks/use-topup-snapshot";
import { CryptoPendingCard } from "./crypto-pending-card";
import { FiatPendingCard } from "./fiat-pending-card";

interface TopupWaitPageProps {
  topupId: string;
}

export function TopupWaitPage({ topupId }: TopupWaitPageProps) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isExpired = useAuthStore((s) => s.isTokenExpired());
  const { data: snapshot, isLoading, isError, error } = useTopupSnapshot(topupId);

  useEffect(() => {
    if (!accessToken || isExpired) {
      router.replace(`/login?next=/topup/${topupId}/wait`);
    }
  }, [accessToken, isExpired, router, topupId]);

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.status === "FULFILLED") {
      router.replace(`/profile/credits?fulfilled=${topupId}`);
    } else if (snapshot.status === "CANCELLED" || snapshot.status === "EXPIRED") {
      router.replace(`/topup?error=${snapshot.status.toLowerCase()}&topupId=${topupId}`);
    }
  }, [snapshot, router, topupId]);

  if (isLoading) {
    return (
      <main
        data-testid="topup-wait-loading"
        className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-6 py-10 text-muted-foreground text-sm"
      >
        Loading topup…
      </main>
    );
  }

  if (isError || !snapshot) {
    return (
      <main
        data-testid="topup-wait-error"
        className="mx-auto w-full max-w-2xl px-6 py-10 text-destructive text-sm"
      >
        Failed to load topup: {error instanceof Error ? error.message : "unknown error"}
      </main>
    );
  }

  return (
    <main
      data-testid="topup-wait-root"
      data-rail={snapshot.rail}
      className="mx-auto w-full max-w-2xl px-6 py-10"
    >
      <header className="mb-6">
        <h1 className="font-bold text-2xl tracking-tight">
          Top up #{snapshot.topupId.slice(-8)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {snapshot.pricing.credits.toLocaleString()} credits
          <span className="px-1">+</span>
          {snapshot.pricing.points.toLocaleString()} points (= ${snapshot.pricing.usd})
        </p>
      </header>

      {snapshot.rail === "CRYPTO" ? (
        <CryptoPendingCard snapshot={snapshot} />
      ) : (
        <FiatPendingCard snapshot={snapshot} />
      )}
    </main>
  );
}
