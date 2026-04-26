import React from "react";
import { act } from "react";
import { render } from "@testing-library/react";
import AgentsPage from "./page";

const mutateSpy = jest.fn();

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: () =>
        ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
          <div {...props}>{children}</div>
        ),
    },
  ),
}));

jest.mock("@/features/agents/components/agent-card", () => ({
  AgentCard: () => <div data-testid="agent-card" />,
}));

jest.mock("@/features/agents/components/filter-bar", () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}));

jest.mock("@/features/agents/components/hero-section", () => ({
  HeroSection: () => <div data-testid="hero-section" />,
}));

jest.mock("@/features/chat/config/agents.config", () => ({
  AGENTS: {},
}));

jest.mock("@/features/onboarding/config/tour-steps", () => ({
  TOUR_NAMES: { agents: "agents" },
}));

jest.mock("@/features/onboarding/hooks/use-onboarding", () => ({
  usePageTour: jest.fn(),
}));

jest.mock("@/gen-ai", () => {
  const React = require("react") as typeof import("react");

  return {
    useSearchAssistantsAssistantsSearchPost: () => {
      const [isPending, setIsPending] = React.useState(false);
      const attempts = React.useRef(0);

      return {
        data: undefined,
        isPending,
        mutate: () => {
          mutateSpy();
          attempts.current += 1;

          if (attempts.current === 1) {
            setIsPending(true);
            setTimeout(() => {
              setIsPending(false);
            }, 0);
          }
        },
      };
    },
  };
});

describe("AgentsPage", () => {
  beforeEach(() => {
    mutateSpy.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("does not retry assistant discovery endlessly after the first failed attempt", async () => {
    render(<AgentsPage />);

    expect(mutateSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(mutateSpy).toHaveBeenCalledTimes(1);
  });
});
