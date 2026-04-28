"use client";

import backendAxios from "@/lib/kubb-backend";

export interface TopupSnapshot {
  topupId: string;
  rail: "CRYPTO" | "FIAT";
  status: "PENDING" | "FULFILLED" | "EXPIRED" | "CANCELLED";
  destination?: string;
  memo?: string;
  amount?: string;
  reference?: string;
  matchedTxHash?: string;
  bankAccount?: {
    name: string;
    bank: string;
    swift: string;
    iban: string;
    country: string;
  };
  pricing: { usd: number; credits: number; points: number };
  createdAt: string;
  expiresAt: string;
  fulfilledAt?: string;
  cancelledAt?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchTopup(topupId: string): Promise<TopupSnapshot> {
  const res = await backendAxios.get<ApiEnvelope<TopupSnapshot> | TopupSnapshot>(
    `/api/topup/${topupId}`,
  );
  const body = res.data as ApiEnvelope<TopupSnapshot> | TopupSnapshot;
  if ("success" in body) {
    if (!body.success) throw new Error("backend reported success=false");
    return body.data;
  }
  return body as TopupSnapshot;
}
