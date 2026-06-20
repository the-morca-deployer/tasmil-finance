"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/use-auth";
import { GasSponsorTrigger } from "./gas-sponsor-trigger";

/**
 * Single mount point inside the (dashboard) route group. Detects which of the
 * three eligible routes the user is on via usePathname() and lets the trigger
 * fire the appropriate `/sponsorship/visit` once per session.
 */
export function SponsorMount() {
  const pathname = usePathname();
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const isLoading = useAuth((s) => s.isLoading);

  const route = detectRoute(pathname);
  if (!route) return null;

  return (
    <GasSponsorTrigger
      route={route}
      authReady={isAuthenticated && !isLoading}
    />
  );
}

function detectRoute(
  pathname: string | null,
): "dashboard" | "chat" | "farming" | null {
  if (!pathname) return null;
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "dashboard";
  }
  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return "chat";
  }
  if (pathname === "/farming" || pathname.startsWith("/farming/")) {
    return "farming";
  }
  return null;
}
