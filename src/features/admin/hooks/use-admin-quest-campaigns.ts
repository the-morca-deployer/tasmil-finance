"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminFetch } from "../lib/admin-fetch";
import { useAdminAuthStore } from "@/store/use-admin-auth";

export interface QuestCampaign {
  id: string;
  title: string;
  protocol: string;
  category: string;
  description: string | null;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  _count?: { tasks: number };
}

export interface QuestTask {
  id: string;
  campaignId: string;
  title: string;
  description: string | null;
  type: string;
  pointReward: number;
  order: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface QuestCampaignDetail extends QuestCampaign {
  tasks: QuestTask[];
}

export function useQuestCampaigns() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<QuestCampaign[]>({
    queryKey: ["admin-quest-campaigns"],
    queryFn: () => adminFetch<QuestCampaign[]>("/api/admin/quest-campaigns"),
    enabled: !!token,
  });
}

export function useQuestCampaignDetail(id: string | null) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<QuestCampaignDetail>({
    queryKey: ["admin-quest-campaign", id],
    queryFn: () => adminFetch<QuestCampaignDetail>(`/api/admin/quest-campaigns/${id}`),
    enabled: !!token && !!id,
  });
}

export function useCreateQuestCampaign() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation<QuestCampaign, Error, Partial<QuestCampaign>>({
    mutationFn: (data) =>
      adminFetch<QuestCampaign>("/api/admin/quest-campaigns", { method: "POST", body: data }),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-campaigns"] });
      toast.success("Campaign created");
      router.push(`/admin/quest-campaigns/${campaign.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create campaign", { description: error.message });
    },
  });
}

export function useUpdateQuestCampaign(id: string) {
  const queryClient = useQueryClient();
  return useMutation<QuestCampaign, Error, Partial<QuestCampaign>>({
    mutationFn: (data) =>
      adminFetch<QuestCampaign>(`/api/admin/quest-campaigns/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-quest-campaigns"] });
      toast.success("Campaign updated");
    },
    onError: (error) => {
      toast.error("Failed to update campaign", { description: error.message });
    },
  });
}

export function useDeleteQuestCampaign() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) =>
      adminFetch(`/api/admin/quest-campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-campaigns"] });
      toast.success("Campaign deleted");
      router.push("/admin/quest-campaigns");
    },
    onError: (error) => {
      toast.error("Failed to delete campaign", { description: error.message });
    },
  });
}

export function useAddQuestTask(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<QuestTask, Error, Partial<QuestTask>>({
    mutationFn: (data) =>
      adminFetch<QuestTask>(`/api/admin/quest-campaigns/${campaignId}/tasks`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-campaign", campaignId] });
      toast.success("Task added");
    },
    onError: (error) => {
      toast.error("Failed to add task", { description: error.message });
    },
  });
}

export function useUpdateQuestTask(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<QuestTask, Error, { taskId: string; data: Partial<QuestTask> }>({
    mutationFn: ({ taskId, data }) =>
      adminFetch<QuestTask>(`/api/admin/quest-campaigns/${campaignId}/tasks/${taskId}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-campaign", campaignId] });
      toast.success("Task updated");
    },
    onError: (error) => {
      toast.error("Failed to update task", { description: error.message });
    },
  });
}

export function useDeleteQuestTask(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (taskId) =>
      adminFetch(`/api/admin/quest-campaigns/${campaignId}/tasks/${taskId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-campaign", campaignId] });
      toast.success("Task deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete task", { description: error.message });
    },
  });
}
