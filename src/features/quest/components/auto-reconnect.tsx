"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@/features/quest/context/wallet-context";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";

/**
 * Renders nothing. When a user has a valid auth session but the wallet
 * is not yet connected (e.g. page refresh), silently attempts reconnect
 * after 3 s as a fallback to wagmi's built-in auto-reconnect.
 */
export function AutoReconnect() {
  const { isConnected, connect } = useWallet();
  const { isAuthenticated, user } = useQuestAuthStore();
  const attempted = useRef(false);

  const hasAuthSession = isAuthenticated && !!user;

  useEffect(() => {
    if (!isConnected && hasAuthSession && !attempted.current) {
      attempted.current = true;
      const timer = setTimeout(() => {
        connect();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isConnected, hasAuthSession, connect]);

  return null;
}
