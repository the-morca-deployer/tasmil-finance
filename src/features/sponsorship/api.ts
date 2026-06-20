import type { SponsorshipMe, TxSubmitResult } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:6756";

interface CallOptions {
  method?: string;
  json?: unknown;
}

async function call<T>(path: string, opts: CallOptions = {}): Promise<T> {
  const headers = new Headers();
  let body: string | undefined;
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers,
    body,
  });
  if (!res.ok) {
    throw new Error(`${opts.method ?? "GET"} ${path} -> ${res.status}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}

export const sponsorshipApi = {
  visit(route: "dashboard" | "chat" | "farming") {
    return call<{ enrolled: boolean; rank: number | null; justEnrolled: boolean }>(
      "/api/sponsorship/visit",
      { method: "POST", json: { route } },
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
