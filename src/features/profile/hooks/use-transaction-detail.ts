"use client";

import { useQuery } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";

export interface TransactionDetail {
  hash: string;
  feeCharged: string;     // stroops
  memo: string | null;
  memoType: string | null;
  ledger: number;
  createdAtIso: string;
}

interface HorizonTxRecord {
  hash: string;
  fee_charged: string;
  memo?: string;
  memo_type?: string;
  ledger: number;
  created_at: string;
}

async function fetchTxDetail(hash: string): Promise<TransactionDetail> {
  const res = await fetch(`${activeNetwork.horizonUrl}/transactions/${hash}`);
  if (!res.ok) throw new Error(`Failed to fetch transaction ${hash}: ${res.status}`);
  const r: HorizonTxRecord = await res.json();
  return {
    hash: r.hash,
    feeCharged: r.fee_charged,
    memo: r.memo ?? null,
    memoType: r.memo_type === "none" ? null : (r.memo_type ?? null),
    ledger: r.ledger,
    createdAtIso: r.created_at,
  };
}

export function useTransactionDetail(hash: string, enabled: boolean) {
  return useQuery<TransactionDetail, Error>({
    queryKey: ["profile", "tx-detail", hash],
    queryFn: () => fetchTxDetail(hash),
    enabled: enabled && !!hash,
    staleTime: 60_000,
  });
}
