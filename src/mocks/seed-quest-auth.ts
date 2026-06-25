/**
 * Seeds quest auth + wallet stores with mock data so all quest pages
 * render without requiring a Stellar wallet connection.
 *
 * Must be called SYNCHRONOUSLY before AppProvider renders.
 * Uses Zustand's setState directly — no React hooks needed.
 */
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import { useQuestWalletStore } from "@/features/quest/store/use-quest-wallet";
import { useWalletStore } from "@/store/use-wallet";

const MOCK_PUBLIC_KEY = "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R";

export function seedQuestAuth() {
  try {
    // Seed quest auth store
    useQuestAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: "user-001",
        username: "stellar_nomad",
        walletAddress: MOCK_PUBLIC_KEY,
        avatarUrl: null,
        tier: "Silver",
        totalPoints: 12450,
        loginStreak: 7,
        referralCode: "TASMIL-X7K9",
        role: "user",
      },
    });

    // Seed quest wallet store (alias of global wallet store)
    useQuestWalletStore.setState({
      connected: true,
      account: MOCK_PUBLIC_KEY,
    });

    // Also seed the main app wallet store for non-quest pages
    useWalletStore.setState({
      connected: true,
      account: MOCK_PUBLIC_KEY,
    });

    console.warn("[msw] Quest auth + wallet seeded — no wallet connect needed");
  } catch (e) {
    console.error("[msw] Failed to seed quest auth:", e);
  }
}
