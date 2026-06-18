"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DEV_BYPASS } from "@/lib/dev-bypass";

function DevBypassActive({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/") {
      router.replace("/chat");
    }
  }, [pathname, router]);

  useEffect(() => {
    const suppress = (e: Event) => {
      e.stopImmediatePropagation();
    };
    window.addEventListener("auth:session-invalid", suppress, true);
    return () => window.removeEventListener("auth:session-invalid", suppress, true);
  }, []);

  return <>{children}</>;
}

export function DevBypassProvider({ children }: { children: React.ReactNode }) {
  if (!DEV_BYPASS) return <>{children}</>;
  return <DevBypassActive>{children}</DevBypassActive>;
}
