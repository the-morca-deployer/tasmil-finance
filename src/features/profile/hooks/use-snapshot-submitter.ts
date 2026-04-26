"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

async function registerAddress(address: string) {
  const res = await fetch("/api/portfolio/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

/**
 * Registers the wallet address for backend portfolio tracking.
 * Called once per session — the backend cron handles all subsequent snapshots.
 */
export function useSnapshotSubmitter(address: string | null | undefined) {
  const registeredRef = useRef<string | null>(null);

  const { mutate } = useMutation({ mutationFn: registerAddress });

  useEffect(() => {
    if (!address || registeredRef.current === address) return;
    registeredRef.current = address;
    mutate(address);
  }, [address, mutate]);
}
