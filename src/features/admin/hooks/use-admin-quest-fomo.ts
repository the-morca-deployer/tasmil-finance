"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { adminFetch } from "../lib/admin-fetch";

export interface FomoEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  multiplier: number;
  countdownDays: number;
  isActive: boolean;
  createdAt?: string;
}

export interface FomoWriteInput {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  multiplier: number;
  countdownDays?: number;
  isActive?: boolean;
}

const FOMO_KEY = ["admin-quest-fomo"] as const;

export function useFomoEvents() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<FomoEvent[]>({
    queryKey: FOMO_KEY,
    queryFn: () => adminFetch<FomoEvent[]>("/api/admin/quest-fomo"),
    enabled: !!token,
  });
}

export function useCreateFomoEvent() {
  const queryClient = useQueryClient();
  return useMutation<FomoEvent, Error, FomoWriteInput>({
    mutationFn: (data) =>
      adminFetch<FomoEvent>("/api/admin/quest-fomo", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOMO_KEY });
      toast.success("FOMO event created");
    },
    onError: (error) => toast.error("Failed to create FOMO event", { description: error.message }),
  });
}

export function useUpdateFomoEvent() {
  const queryClient = useQueryClient();
  return useMutation<FomoEvent, Error, { id: string; data: Partial<FomoWriteInput> }>({
    mutationFn: ({ id, data }) =>
      adminFetch<FomoEvent>(`/api/admin/quest-fomo/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOMO_KEY });
      toast.success("FOMO event updated");
    },
    onError: (error) => toast.error("Failed to update FOMO event", { description: error.message }),
  });
}

export function useDeleteFomoEvent() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => adminFetch(`/api/admin/quest-fomo/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOMO_KEY });
      toast.success("FOMO event deleted");
    },
    onError: (error) => toast.error("Failed to delete FOMO event", { description: error.message }),
  });
}
