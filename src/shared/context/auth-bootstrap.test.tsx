import { render, waitFor } from "@testing-library/react";
import { AuthBootstrap } from "./auth-bootstrap";

const setAuthState = jest.fn();
const logout = jest.fn();

let storeState: {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: { walletAddress: string } | null;
  isTokenExpired: () => boolean;
};

jest.mock("@/store/use-auth", () => ({
  useAuthStore: Object.assign(
    (
      selector: (
        s: typeof storeState & {
          setAuthState: typeof setAuthState;
          logout: typeof logout;
        }
      ) => unknown
    ) => selector({ ...storeState, setAuthState, logout }),
    {
      getState: () => ({ ...storeState, setAuthState, logout }),
    }
  ),
}));

jest.mock("@/lib/runtime-urls", () => ({
  getBrowserBackendBaseUrl: () => "http://test-backend",
}));

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  setAuthState.mockReset();
  logout.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  storeState = {
    isAuthenticated: true,
    accessToken: null,
    user: { walletAddress: "GABC" },
    isTokenExpired: () => false,
  };
});

describe("AuthBootstrap", () => {
  it("rehydrates accessToken from /api/auth/me when persisted user has no token", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          accessToken: "fresh-jwt",
          user: {
            id: "u1",
            walletAddress: "GABC",
            createdAt: "x",
            updatedAt: "y",
          },
        },
      }),
    });

    render(<AuthBootstrap />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-backend/api/auth/me",
        expect.objectContaining({ credentials: "include" })
      )
    );
    await waitFor(() =>
      expect(setAuthState).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: "fresh-jwt" })
      )
    );
    expect(logout).not.toHaveBeenCalled();
  });

  it("calls logout on 401", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(<AuthBootstrap />);

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(setAuthState).not.toHaveBeenCalled();
  });

  it("does nothing when access token is already present", async () => {
    storeState.accessToken = "existing-jwt";

    render(<AuthBootstrap />);

    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setAuthState).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it("does nothing when user is not authenticated", async () => {
    storeState.isAuthenticated = false;
    storeState.user = null;

    render(<AuthBootstrap />);

    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("leaves state alone on network error", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    render(<AuthBootstrap />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(setAuthState).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });
});
