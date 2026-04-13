"use client";

import { useEffect } from "react";

/**
 * Removes legacy `theme` key from localStorage after hydration.
 * next-themes reads `theme` by default. If a stale value exists,
 * it overrides prefers-color-scheme. Changing the storage key to
 * `tasmil-ui-theme` fixes first paint for fresh sessions. This
 * cleanup handles users who visited before the key change.
 */
export function ThemeStorageMigration() {
  useEffect(() => {
    try {
      localStorage.removeItem("theme");
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
    }
  }, []);

  return null;
}
