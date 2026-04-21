export type ProxyRewrite = {
  source: string;
  destination: string;
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function getPublicAiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env["NEXT_PUBLIC_AI_URL"] ?? "";
  return url ? trimTrailingSlash(url) : "";
}

export function getServerAiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env["AI_INTERNAL_URL"] ?? "http://localhost:8001";
  return trimTrailingSlash(url);
}

export function getServerBackendBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url =
    env["BACKEND_INTERNAL_URL"] ?? env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:6756";
  return trimTrailingSlash(url);
}

export function getAiProxyRewrites(env: NodeJS.ProcessEnv = process.env): ProxyRewrite[] {
  const aiBaseUrl = getServerAiBaseUrl(env);

  return [
    {
      source: "/assistants/:path*",
      destination: `${aiBaseUrl}/assistants/:path*`,
    },
    {
      source: "/threads/:path*",
      destination: `${aiBaseUrl}/threads/:path*`,
    },
    {
      source: "/runs/:path*",
      destination: `${aiBaseUrl}/runs/:path*`,
    },
    {
      source: "/info",
      destination: `${aiBaseUrl}/info`,
    },
    {
      source: "/ok",
      destination: `${aiBaseUrl}/ok`,
    },
  ];
}
