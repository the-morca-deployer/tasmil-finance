"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth";
import { sponsorshipApi } from "../api";

export function useSponsorshipVisit(route: "dashboard" | "chat" | "farming", authReady: boolean) {
  const qc = useQueryClient();
  // Key the visit-debounce by walletAddress too — switching wallets in the
  // same tab must fire a fresh /visit for the new wallet; the previous
  // wallet's key would otherwise short-circuit enrollment for the new user.
  const walletAddress = useAuthStore((s) => s.user?.walletAddress);

  useEffect(() => {
    if (!authReady) return;
    if (typeof window === "undefined") return;
    const who = walletAddress ?? "anon";
    const key = `tasmil:sponsorship:visited:${route}:${who}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    sponsorshipApi
      .visit(route)
      .then((r) => {
        if (r.justEnrolled) {
          qc.invalidateQueries({ queryKey: ["sponsorship", "me"] });
        }
      })
      .catch(() => {
        sessionStorage.removeItem(key);
      });
  }, [route, authReady, qc, walletAddress]);
}
