/**
 * Axios client for NestJS backend (port 6756).
 * - Automatically attaches JWT Bearer token from auth store
 * - Fires auth:session-invalid event on 401 (with token freshness + URL)
 *
 * baseURL is the host only (no /api suffix) because OpenAPI paths
 * from NestJS already include the /api global prefix.
 *
 * Used by kubb-backend-client.ts as the transport for all generated
 * src/gen-backend/ client functions.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getBrowserBackendBaseUrl } from "@/lib/runtime-urls";
import { useAuthStore } from "@/store/use-auth";

export const getBackendBaseUrl = () => {
  return getBrowserBackendBaseUrl();
};

// Bumped from 30s → 90s. Withdraw/deposit endpoints chain multiple Soroban
// RPC simulations (read shares, build strategy withdraw, read keeper
// balances, build keeper transfer, simulate each) and routinely take
// 20–40s on mainnet, especially under RPC 429 backoff.
const backendAxios = axios.create({
  baseURL: getBackendBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 90000,
});

// Attach JWT from auth store on every request
backendAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — dispatch a typed event with token freshness so the
// auth handler can decide whether to force-sign or surface a reconnect prompt.
backendAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      if (typeof window !== "undefined") {
        const fresh = !useAuthStore.getState().isTokenExpired();
        const url = orig?.url ?? "unknown";
        console.warn(`[auth] 401 from ${url} (token fresh=${fresh})`);
        window.dispatchEvent(new CustomEvent("auth:session-invalid", { detail: { fresh, url } }));
      }
    }
    return Promise.reject(error);
  }
);

type KubbClient = typeof backendAxios & {
  getConfig: () => Record<string, unknown>;
  setConfig: (config: Record<string, unknown>) => Record<string, unknown>;
};

export const backendClient = {
  client: Object.assign(backendAxios, {
    getConfig: () => ({}),
    setConfig: (config: Record<string, unknown>) => config,
  } as const) as KubbClient,
} as const;

// Convenience query config presets (mirrors src/lib/kubb.ts pattern)
export const $b = {
  ...backendClient,
  query: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },
} as const;

export const $bLive = {
  ...backendClient,
  query: {
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  },
} as const;

export default backendAxios;
