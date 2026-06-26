// After merge, quest uses main backend's cookie-based auth (tasmil_auth cookie).
// This file provides the same interface (useQuestAuthStore) for backward
// compatibility with existing imports, but reads state from the main app's auth.
import { create } from "zustand";

export interface AuthUser {
  id: string;
  username: string;
  walletAddress: string;
  avatarUrl?: string | null;
  tier: string;
  totalPoints: number;
  loginStreak: number;
  referralCode?: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
}

// Quest auth store — now backed by main backend cookie session.
// isAuthenticated is set by wallet-context after GET /api/auth/me succeeds.
export const useQuestAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  updateUser: (partial) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...partial } });
  },
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
