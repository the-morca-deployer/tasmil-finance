"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { publicControllerGetQuestVolume } from "@/gen-backend/client/public-controller-get-quest-volume";
import type { QuestVolumeResponseDto } from "@/gen-backend/types/quest-volume-response-dto";

export function useQuestVolume(limit = 25) {
  return useInfiniteQuery({
    queryKey: ["public", "quest-volume", limit] as const,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const res = await publicControllerGetQuestVolume(
        { limit, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      );
      // Backend wraps the DTO in a { success, data } envelope (see use-traction.ts).
      return (res as unknown as { data: QuestVolumeResponseDto }).data;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}
