"use client";
import { useQuery } from "@tanstack/react-query";
import { sponsorshipApi } from "../api";

export function useSponsorshipMe(enabled = true) {
  return useQuery({
    queryKey: ["sponsorship", "me"],
    queryFn: () => sponsorshipApi.me(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
