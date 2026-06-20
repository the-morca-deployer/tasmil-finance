// src/lib/api-client.ts
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_QUEST_API_URL || "http://localhost:5555";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token as string);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useQuestAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            orig.headers.Authorization = `Bearer ${token}`;
            return apiClient(orig);
          })
          .catch((err) => Promise.reject(err));
      }

      orig._retry = true;
      isRefreshing = true;
      const { refreshToken, logout, setTokens } = useQuestAuthStore.getState();

      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken: newToken, refreshToken: newRefresh } = data.data;
        setTokens(newToken, newRefresh);
        processQueue(null, newToken);
        orig.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(orig);
      } catch (e) {
        processQueue(e as Error, null);
        logout();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

type KubbClient = AxiosInstance & {
  getConfig: () => Partial<any>;
  setConfig: (config: any) => Partial<any>;
};

const kubbClient = {
  client: Object.assign(apiClient, {
    getConfig: () => ({}),
    setConfig: (config: any) => config,
  } as const) as KubbClient,
} as const;

export { kubbClient };
export default apiClient;
