"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /agents is deprecated in the one-chat-interface.
 * Redirect to /chat/new so bookmarked links still work.
 */
export default function AgentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat/new");
  }, [router]);

  return null;
}
