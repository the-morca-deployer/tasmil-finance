"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";
import fetch from "@/lib/kubb-backend-client";
import { unwrapBackendData } from "./transport";

const configuredNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

const rejectionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["NET_EDGE_DECLINE", "PRICE_REFUSAL", "GUARD_REFUSAL", "POLICY_REJECTED"]),
  entryType: z.enum(["DECLINE", "REFUSAL", "FAILED"]),
  decisionId: z.string().nullable(),
  code: z.string().nullable(),
  reason: z.string().nullable(),
  keeperWallet: z.string().nullable(),
  network: z.enum(["mainnet", "testnet"]),
  latestLedger: z.string().nullable(),
  txHash: z.string().nullable(),
  explorerUrl: z.string().url().nullable(),
  createdAt: z.string(),
});

const pageSchema = z.object({
  items: z.array(rejectionSchema),
  nextCursor: z.string().nullable(),
});

export type PolicyRejection = z.infer<typeof rejectionSchema>;

/** Protocol-wide policy rejections (GET /api/fees/rejections), public, no wallet needed. */
export function usePolicyRejections(limit = 25) {
  return useInfiniteQuery({
    queryKey: ["public", "policy-rejections", configuredNetwork, limit] as const,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const res = await fetch({
        method: "GET",
        url: "/api/fees/rejections",
        params: {
          network: configuredNetwork,
          limit: String(limit),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        signal,
      });
      return pageSchema.parse(unwrapBackendData(res));
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}
