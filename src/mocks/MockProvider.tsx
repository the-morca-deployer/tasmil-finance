"use client";

import type { ReactNode } from "react";
import { seedQuestAuth } from "./seed-quest-auth";
import { applyMockAdapter } from "./apply-mocks";

const MOCK = process.env.NEXT_PUBLIC_MOCK_API === "true";

// Seed stores + install interceptor before ANY component renders.
// This runs at module eval time, which is before React mount.
if (typeof window !== "undefined" && MOCK) {
  seedQuestAuth();
  applyMockAdapter();
}

export function MockProvider({ children }: { children: ReactNode }) {
  // No async setup needed — everything happens synchronously above.
  return <>{children}</>;
}
