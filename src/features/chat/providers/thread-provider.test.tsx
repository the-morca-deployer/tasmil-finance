import { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { ThreadProvider, useThreads } from "./thread-provider";

const mockSearch = jest.fn().mockResolvedValue([]);
const mockCreateClient = jest.fn((_apiUrl?: unknown, _options?: unknown) => ({
  threads: {
    search: mockSearch,
  },
}));

jest.mock("uuid", () => ({
  validate: () => false,
}));

jest.mock("../lib/client", () => ({
  createClient: (apiUrl: unknown, options: unknown) =>
    mockCreateClient(apiUrl, options),
}));

jest.mock("@/lib/api-key", () => ({
  getApiKey: () => null,
}));

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({ address: "GABC123" }),
}));

jest.mock("@/store/use-auth", () => ({
  useAuthStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: "jwt-token" }),
}));

function Probe() {
  const { getThreads } = useThreads();

  useEffect(() => {
    void getThreads("supervisor");
  }, [getThreads]);

  return null;
}

describe("ThreadProvider", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_AI_URL = "http://ai.local";
    mockCreateClient.mockClear();
    mockSearch.mockClear();
  });

  it("creates the AI client with both JWT and wallet address", async () => {
    render(
      <ThreadProvider agentId="supervisor">
        <Probe />
      </ThreadProvider>
    );

    await waitFor(() =>
      expect(mockCreateClient).toHaveBeenCalledWith(window.location.origin, {
        apiKey: undefined,
        accessToken: "jwt-token",
        walletAddress: "GABC123",
      })
    );
  });
});
