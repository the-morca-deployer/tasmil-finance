"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface RedeemResult {
  id: string;
  seatNumber?: number;
  walletAddress: string;
  redeemedAt: string;
}

async function redeemCode(payload: { walletAddress: string; code: string }) {
  const res = await fetch("/api/waitlist/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await res.json();
  if (!res.ok) throw new Error(raw.message ?? "Failed to redeem code");
  return (raw.data ?? raw) as RedeemResult;
}

export function useRedeemCode() {
  return useMutation({
    mutationFn: redeemCode,
    onSuccess: () => {
      toast.success("Access granted!", {
        description: "Your seat is secured. Welcome to Tasmil.",
      });
    },
    onError: (error: Error) => {
      toast.error("Redemption failed", {
        description: error.message ?? "Invalid or expired code.",
      });
    },
  });
}
