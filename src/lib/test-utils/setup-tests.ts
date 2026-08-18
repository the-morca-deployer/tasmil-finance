import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Configure React Testing Library
configure({
  testIdAttribute: "data-testid",
});

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock wallet context for Stellar testing
jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({
    isConnected: true,
    isAuthenticated: true,
    isAuthenticating: false,
    address: "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
    displayAddress: "GABC...CDEF",
    user: null,
    connect: jest.fn(),
    connectWalletOnly: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
    forceReauth: jest.fn(),
  }),
}));

// Mock React Query.
// The default return value must be a VALID react-query result object, not the
// bare `undefined` a plain `jest.fn()` yields. `undefined` crashes any component
// doing `const { data } = useQuery(...)` and any Kubb-generated hook doing
// `query.queryKey = queryKey` on the useQuery result - i.e. it fails for a
// reason that has nothing to do with the behaviour under test. `data: undefined`
// still models "no data yet", so suites that want specific data keep overriding
// via `(useQuery as jest.Mock).mockReturnValue(...)`.
// NOTE: jest.config sets `clearMocks` (mockClear) and `restoreMocks`
// (spies only), neither of which strips a `jest.fn(impl)` implementation, so
// these defaults survive between tests.
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isPending: false,
    isFetching: false,
    isError: false,
    isSuccess: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    reset: jest.fn(),
  })),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    refetchQueries: jest.fn(),
  }),
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
