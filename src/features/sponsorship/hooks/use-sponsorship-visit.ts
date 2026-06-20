"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sponsorshipApi } from "../api";

export function useSponsorshipVisit(
  route: "dashboard" | "chat" | "farming",
  authReady: boolean,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!authReady) return;
    if (typeof window === "undefined") return;
    const key = `tasmil:sponsorship:visited:${route}`;
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
  }, [route, authReady, qc]);
}
