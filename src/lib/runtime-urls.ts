export type ProxyRewrite = {
  source: string;
  destination: string;
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

// ── Base URLs ────────────────────────────────────────────────────────────────
// Contract by context:
//   public  → NEXT_PUBLIC_* absolute URL (SSR metadata / absolute links).
//   browser → the current window origin, so browser calls hit same-origin paths
//             (/api/*, /agui, …) and are forwarded by the next.config rewrites.
//   server  → the internal service URL the Next server uses to reach the service
//             (AI_INTERNAL_URL / BACKEND_INTERNAL_URL), with a localhost dev fallback.

export function getPublicAiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.NEXT_PUBLIC_AI_URL ?? "";
  return url ? trimTrailingSlash(url) : "";
}

export function getBrowserAiBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
  locationOrigin: string | null | undefined = typeof window !== "undefined"
    ? window.location.origin
    : undefined
): string {
  const url = locationOrigin ?? env.NEXT_PUBLIC_AI_URL ?? "";
  return url ? trimTrailingSlash(url) : "";
}

export function getServerAiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.AI_INTERNAL_URL;
  if (url) return trimTrailingSlash(url);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: AI_INTERNAL_URL");
  }
  return "http://localhost:8001";
}

export function getServerBackendBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.BACKEND_INTERNAL_URL ?? env.NEXT_PUBLIC_BACKEND_URL;
  if (url) return trimTrailingSlash(url);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: BACKEND_INTERNAL_URL");
  }
  return "http://localhost:6756";
}

export function getBrowserBackendBaseUrl(
  _env: NodeJS.ProcessEnv = process.env,
  locationOrigin: string | null | undefined = typeof window !== "undefined"
    ? window.location.origin
    : undefined
): string {
  const url = locationOrigin ?? "";
  return url ? trimTrailingSlash(url) : "";
}

// ── Proxy rewrites (single source of truth) ──────────────────────────────────
// next.config rewrites() forwards these same-origin paths to the upstream
// service. To expose a NEW pass-through path, add ONE entry to `prefixes`
// (matches `<path>/:path*`) or `exact` below — no need to edit next.config or
// hand-write the rewrite shape, and the test stays green automatically.

type ProxyTarget = {
  baseUrl: (env: NodeJS.ProcessEnv) => string;
  /** Forwarded as `<prefix>/:path*`. */
  prefixes: string[];
  /** Forwarded verbatim (single endpoint, no wildcard). */
  exact: string[];
};

const PROXY_TARGETS = {
  ai: {
    baseUrl: getServerAiBaseUrl,
    prefixes: ["/assistants", "/threads", "/runs", "/agui"],
    exact: ["/info", "/ok"],
  },
  backend: {
    baseUrl: getServerBackendBaseUrl,
    prefixes: [
      "/api/public",
      "/api/account",
      "/api/admin",
      "/api/admin-auth",
      "/api/auth",
      "/api/chat-usage",
      "/api/credit",
      "/api/email",
      "/api/internal/credit",
      "/api/marketplace",
      "/api/pools",
      "/api/protocol",
      "/api/rebalance",
      "/api/referral",
      "/api/topup",
      "/api/user",
      "/api/users",
      "/api/welcome-reward",
      "/api/quest",
      "/api/sponsorship",
      "/api/tx",
    ],
    exact: ["/api/health"],
  },
} satisfies Record<string, ProxyTarget>;

function buildRewrites(target: ProxyTarget, env: NodeJS.ProcessEnv): ProxyRewrite[] {
  const base = target.baseUrl(env);
  return [
    ...target.prefixes.map((p) => ({ source: `${p}/:path*`, destination: `${base}${p}/:path*` })),
    ...target.exact.map((p) => ({ source: p, destination: `${base}${p}` })),
  ];
}

export function getAiProxyRewrites(env: NodeJS.ProcessEnv = process.env): ProxyRewrite[] {
  return buildRewrites(PROXY_TARGETS.ai, env);
}

export function getBackendProxyRewrites(env: NodeJS.ProcessEnv = process.env): ProxyRewrite[] {
  return buildRewrites(PROXY_TARGETS.backend, env);
}

/** All upstream proxy rewrites, for next.config rewrites(). */
export function getProxyRewrites(env: NodeJS.ProcessEnv = process.env): ProxyRewrite[] {
  return [...getBackendProxyRewrites(env), ...getAiProxyRewrites(env)];
}
