"use client";

import { usePublicControllerGetTraction } from "@/gen-backend/hooks/use-public-controller-get-traction";
import { $b } from "@/lib/kubb-backend";
import type { TractionData } from "../types";

export function useTraction() {
  return usePublicControllerGetTraction({
    query: {
      ...$b.query,
      select: (res: unknown): TractionData | null => (res as { data?: TractionData }).data ?? null,
    },
  });
}
