import { useQuery } from "@tanstack/react-query";
import backendAxios from "@/lib/kubb-backend";
import { useWallet } from "@/shared/context/wallet-context";

export interface ChatUsageView {
  daily: { used: number; max: number; remaining: number };
  credits: { balance: number; pending: number };
  bothExhausted: boolean;
}

interface SnapshotEnvelope {
  success: boolean;
  data: {
    baseTurns: number;
    committedTurns: number;
    remainingTurns: number;
    credits: number;
    creditPending: number;
  };
}

function unwrapSnapshot(
  payload: SnapshotEnvelope | SnapshotEnvelope["data"],
): SnapshotEnvelope["data"] {
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return (payload as SnapshotEnvelope).data;
  }
  return payload as SnapshotEnvelope["data"];
}

export function useChatUsage() {
  const { isAuthenticated, address } = useWallet();
  return useQuery<ChatUsageView>({
    queryKey: ["chat-usage", address],
    enabled: isAuthenticated && !!address,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
    queryFn: async () => {
      const response = await backendAxios.get<
        SnapshotEnvelope | SnapshotEnvelope["data"]
      >("/api/chat-usage/me");
      const snap = unwrapSnapshot(response.data);
      const daily = {
        used: snap.committedTurns,
        max: snap.baseTurns,
        remaining: snap.remainingTurns,
      };
      const credits = { balance: snap.credits, pending: snap.creditPending };
      return {
        daily,
        credits,
        bothExhausted:
          daily.remaining <= 0 && credits.balance - credits.pending <= 0,
      };
    },
  });
}
