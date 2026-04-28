import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useChatUsage } from "../use-chat-usage";

const getMock = jest.fn();

jest.mock("@/lib/kubb-backend", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({ isAuthenticated: true, address: "GABC" }),
}));

jest.mock("@tanstack/react-query", () => jest.requireActual("@tanstack/react-query"));

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => getMock.mockReset());

test("returns daily and credits buckets from the credit-aware snapshot", async () => {
  getMock.mockResolvedValue({
    data: {
      success: true,
      data: {
        baseTurns: 10,
        committedTurns: 3,
        remainingTurns: 7,
        credits: 47,
        creditPending: 0,
      },
    },
  });

  const { result } = renderHook(() => useChatUsage(), { wrapper: wrap });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data).toEqual({
    daily: { used: 3, max: 10, remaining: 7 },
    credits: { balance: 47, pending: 0 },
    bothExhausted: false,
  });
});

test("flags bothExhausted when daily=0 AND credits=0", async () => {
  getMock.mockResolvedValue({
    data: {
      success: true,
      data: {
        baseTurns: 10,
        committedTurns: 10,
        remainingTurns: 0,
        credits: 0,
        creditPending: 0,
      },
    },
  });

  const { result } = renderHook(() => useChatUsage(), { wrapper: wrap });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data?.bothExhausted).toBe(true);
});

test("does not flag bothExhausted when only daily=0 but credits>0", async () => {
  getMock.mockResolvedValue({
    data: {
      success: true,
      data: {
        baseTurns: 10,
        committedTurns: 10,
        remainingTurns: 0,
        credits: 5,
        creditPending: 0,
      },
    },
  });

  const { result } = renderHook(() => useChatUsage(), { wrapper: wrap });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data?.bothExhausted).toBe(false);
});
