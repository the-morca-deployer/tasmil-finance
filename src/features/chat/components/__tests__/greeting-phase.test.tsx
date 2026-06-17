import { fireEvent, render, screen } from "@testing-library/react";
import { Greeting } from "../greeting";

jest.mock("@/features/chat/config", () => ({
  getAgentConfig: () => ({
    id: "supervisor",
    name: "Supervisor",
    icon: "/agents/supervisor-agent.png",
  }),
}));

jest.mock("@/shared/components/token-image", () => ({
  TokenImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock("@/shared/ui/typography", () => ({
  Typography: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul {...props}>{children}</ul>
    ),
  },
}));

test("Phase 2 first login shows welcome card with claim link", () => {
  render(
    <Greeting
      agentId="supervisor"
      phase="beta"
      isFirstLogin
      daysSinceLastStake={0}
      lastPoolEarnings={null}
    />
  );
  expect(screen.getByText(/earliest users/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /claim reward/i })).toBeInTheDocument();
});

test("Phase 3 new user shows real-funds card", () => {
  render(
    <Greeting
      agentId="supervisor"
      phase="mainnet"
      isFirstLogin
      daysSinceLastStake={0}
      lastPoolEarnings={null}
    />
  );
  expect(screen.getByText(/real funds, real yield/i)).toBeInTheDocument();
});

test("Phase 3 returning ≥7d shows reinvest card and calls onReinvest", () => {
  const onReinvest = jest.fn();
  render(
    <Greeting
      agentId="supervisor"
      phase="mainnet"
      isFirstLogin={false}
      daysSinceLastStake={10}
      lastPoolEarnings={22.5}
      onReinvest={onReinvest}
      onSnooze={jest.fn()}
    />
  );
  expect(screen.getByText(/\$22\.5/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /reinvest now/i }));
  expect(onReinvest).toHaveBeenCalled();
});

test("No phase card when conditions not met — renders default content", () => {
  render(
    <Greeting
      agentId="supervisor"
      phase="beta"
      isFirstLogin={false}
      daysSinceLastStake={2}
      lastPoolEarnings={null}
    />
  );
  expect(screen.getByText(/DeFi Assistant/i)).toBeInTheDocument();
  expect(screen.queryByText(/earliest users/i)).not.toBeInTheDocument();
});
