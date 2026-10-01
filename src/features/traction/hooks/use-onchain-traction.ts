"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import fetch from "@/lib/kubb-backend-client";
import { onchainTractionSchema, onchainTxPageSchema } from "../onchain";

// Backend wraps every DTO in a { success, data } envelope (see use-traction.ts).
const unwrap = (res: { data: unknown }) => (res.data as { data: unknown }).data;

export function useOnchainTraction() {
  return useQuery({
    queryKey: ["public", "traction-onchain"] as const,
    queryFn: async ({ signal }) => {
      const res = await fetch({ method: "GET", url: "/api/public/traction/onchain", signal });
      return onchainTractionSchema.parse(unwrap(res));
    },
    staleTime: 60_000,
  });
}

export function useOnchainTxs(limit = 20) {
  return useInfiniteQuery({
    queryKey: ["public", "traction-onchain-txs", limit] as const,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const res = await fetch({
        method: "GET",
        url: "/api/public/traction/onchain/txs",
        params: { limit, ...(pageParam ? { cursor: pageParam } : {}) },
        signal,
      });
      return onchainTxPageSchema.parse(unwrap(res));
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}
