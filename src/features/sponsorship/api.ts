import { useAuthStore } from "@/store/use-auth";
import type { SponsorshipMe, TxSubmitResult } from "./types";

interface CallOptions {
  method?: string;
  json?: unknown;
}

// Relative `/api/...` paths go through the Next dev/proxy.ts rewrite to the
// backend on :6756, which makes the calls work from a devtunnel browser
// session (the previous hardcoded http://localhost:6756 was unreachable).
async function call<T>(path: string, opts: CallOptions = {}): Promise<T> {
  const headers = new Headers();
  let body: string | undefined;
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  }
  const token = useAuthStore.getState().accessToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers,
    body,
  });
  if (!res.ok) {
    throw new Error(`${opts.method ?? "GET"} ${path} -> ${res.status}`);
  }
  // Backend ships `{success, data}` envelope from controllers AND a global
  // response interceptor re-wraps it - yielding `{success, data:{success,data:T}}`.
  // Unwrap both layers when present so callers see just `T`.
  const json = (await res.json()) as {
    success?: boolean;
    data?: T | { success?: boolean; data?: T };
  };
  const inner = json?.data as { success?: boolean; data?: T } | T | undefined;
  if (inner && typeof inner === "object" && "success" in inner && "data" in inner) {
    return inner.data as T;
  }
  return inner as T;
}

export const sponsorshipApi = {
  visit(route: "dashboard" | "chat" | "farming") {
    return call<{ enrolled: boolean; rank: number | null; justEnrolled: boolean }>(
      "/api/sponsorship/visit",
      { method: "POST", json: { route } }
    );
  },

  me() {
    return call<SponsorshipMe>("/api/sponsorship/me");
  },

  async markModalSeen(): Promise<void> {
    await call<{ modalSeen: true }>("/api/sponsorship/modal-seen", {
      method: "POST",
    });
  },

  submitWithSponsor(params: {
    signedInnerXdr: string;
    meta: {
      action: string;
      protocol: string;
      asset?: string;
      poolLabel?: string;
    };
  }) {
    return call<TxSubmitResult>("/api/tx/submit-with-sponsor", {
      method: "POST",
      json: params,
    });
  },
};
