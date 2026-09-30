"use client";

import { useEffect, useState } from "react";
import { ensureQuestDevSession } from "@/features/quest/lib/dev-login-bridge";
import { DEV_BYPASS } from "@/lib/dev-bypass";

function DevBypassActive({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const suppress = (e: Event) => {
      e.stopImmediatePropagation();
    };
    window.addEventListener("auth:session-invalid", suppress, true);
    void ensureQuestDevSession().finally(() => setReady(true));
    return () => window.removeEventListener("auth:session-invalid", suppress, true);
  }, []);

  return ready ? children : null;
}

export function DevBypassProvider({ children }: { children: React.ReactNode }) {
  if (!DEV_BYPASS) return <>{children}</>;
  return <DevBypassActive>{children}</DevBypassActive>;
}
