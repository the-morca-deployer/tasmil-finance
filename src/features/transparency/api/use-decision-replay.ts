"use client";

import { useActivityControllerReplay } from "@/gen-backend/hooks";
import { adaptReplay } from "./adapters";
import { unwrapBackendData } from "./transport";

export function useDecisionReplay(decisionId: string) {
  const query = useActivityControllerReplay(decisionId, {
    query: {
      staleTime: 30_000,
      select: (value: unknown) => adaptReplay(unwrapBackendData(value)),
    },
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: () => void query.refetch(),
  };
}
