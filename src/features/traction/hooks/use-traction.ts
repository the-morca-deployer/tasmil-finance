"use client";

import { usePublicControllerGetTraction } from "@/gen-backend/hooks/use-public-controller-get-traction";
import { $b } from "@/lib/kubb-backend";
import { parseTractionData } from "../evidence";

export function useTraction() {
  return usePublicControllerGetTraction({
    query: {
      ...$b.query,
      select: (res: unknown) => {
        const value = (res as { data?: unknown }).data;
        return value === undefined ? null : parseTractionData(value);
      },
    },
  });
}
