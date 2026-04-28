import { render, screen } from "@testing-library/react";
import { ChatUsageBadge } from "../chat-usage-badge";

test("renders 'X/Y daily • Z credits' when both pools have stock", () => {
  render(
    <ChatUsageBadge
      data={{
        daily: { used: 3, max: 10, remaining: 7 },
        credits: { balance: 47, pending: 0 },
        bothExhausted: false,
      }}
    />,
  );
  expect(screen.getByText(/7\/10 daily/i)).toBeInTheDocument();
  expect(screen.getByText(/47 credits/i)).toBeInTheDocument();
});

test("highlights credits when daily exhausted but credits remain", () => {
  render(
    <ChatUsageBadge
      data={{
        daily: { used: 10, max: 10, remaining: 0 },
        credits: { balance: 5, pending: 0 },
        bothExhausted: false,
      }}
    />,
  );
  const credits = screen.getByText(/5 credits/i);
  expect(credits).toBeInTheDocument();
  expect(credits.parentElement?.className ?? "").toMatch(/active/i);
});

test("returns banner when both pools are exhausted", () => {
  render(
    <ChatUsageBadge
      data={{
        daily: { used: 10, max: 10, remaining: 0 },
        credits: { balance: 0, pending: 0 },
        bothExhausted: true,
      }}
    />,
  );
  expect(screen.getByRole("link", { name: /topup/i })).toHaveAttribute(
    "href",
    "/topup",
  );
});

test("renders nothing while data is loading", () => {
  const { container } = render(<ChatUsageBadge data={undefined} />);
  expect(container).toBeEmptyDOMElement();
});
