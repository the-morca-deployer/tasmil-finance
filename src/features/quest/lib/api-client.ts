// Quest API calls go through Next.js proxy to main backend (same origin, no CORS).
// Auth is handled via httpOnly cookie (tasmil_auth) — no token management needed.
import axios, { type AxiosInstance } from "axios";

export const questApiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Unwrap main backend's TransformInterceptor { success, data } envelope
questApiClient.interceptors.response.use(
  (response) => {
    if (response.data?.success === true && "data" in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => Promise.reject(error),
);

// Kubb client wrapper — required by auto-generated hooks via kubb-config.ts
type KubbClient = AxiosInstance & {
  getConfig: () => Partial<Record<string, unknown>>;
  setConfig: (config: Partial<Record<string, unknown>>) => Partial<Record<string, unknown>>;
};

export const kubbClient = {
  client: Object.assign(questApiClient, {
    getConfig: () => ({}),
    setConfig: (config: Partial<Record<string, unknown>>) => config,
  }) as KubbClient,
} as const;

export default questApiClient;

// ── Mock mode — install Axios adapter at module creation time ──────────
// Static import ensures interceptor is installed BEFORE any request fires.
import { installQuestMocks } from "./mock-interceptor";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MOCK_API === "true") {
  installQuestMocks(questApiClient);
}
