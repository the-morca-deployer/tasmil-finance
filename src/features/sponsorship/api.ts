import type { SponsorshipMe, TxSubmitResult } from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:6756";

async function call<T>(
  path: string,
  init?: RequestInit & { body?: BodyInit | object },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body: BodyInit | undefined;
  if (init?.body !== undefined) {
    if (
      typeof init.body === "string" ||
      init.body instanceof FormData ||
      init.body instanceof Blob ||
      init.body instanceof ArrayBuffer
    ) {
      body = init.body as BodyInit;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(init.body);
    }
  }
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
    body,
  });
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} -> ${res.status}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}

export const sponsorshipApi = {
  visit(route: "dashboard" | "chat" | "farming") {
    return call<{ enrolled: boolean; rank: number | null; justEnrolled: boolean }>(
      "/api/sponsorship/visit",
      { method: "POST", body: { route } },
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
      body: params,
    });
  },
};
