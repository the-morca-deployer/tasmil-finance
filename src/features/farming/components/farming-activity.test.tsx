import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ActivityItem } from "@/features/account/types";
import { FarmingActivity, type PolicyTimelineRow } from "./farming-activity";

const now = Date.now();
const ago = (min: number) => new Date(now - min * 60_000).toISOString();

const activities = [
  {
    id: "a1",
    type: "DEPOSIT",
    detail: "Deposited 10 XLM",
    amount: 10,
    token: "XLM",
    txHash: "b".repeat(64),
    createdAt: ago(60),
  },
  {
    id: "a2",
    type: "PRESET_CHANGE",
    detail: "Changed preset from BALANCED to AGGRESSIVE",
    createdAt: ago(30),
  },
] as unknown as ActivityItem[];

const policyItems: PolicyTimelineRow[] = [
  {
    id: "p1",
    createdAt: ago(5),
    outcome: "declined",
    title: "Agent declined a move",
    reason: "Gain $0.04 is below cost $0.11",
    txUrl: null,
    replayHref: "/activity/d1",
  },
  {
    id: "p2",
    createdAt: ago(45),
    outcome: "rejected",
    title: "Rejected on-chain by Policy Guard",
    reason: "The transaction broke a vault rule and was reverted",
    txUrl: `https://stellar.expert/explorer/public/tx/${"c".repeat(64)}`,
    replayHref: null,
  },
];

function titles() {
  return screen
    .getAllByText(
      /^(Agent declined a move|Rejected on-chain by Policy Guard|Deposit|Strategy Changed)$/
    )
    .map((el) => el.textContent);
}

describe("FarmingActivity", () => {
  it("shows account events and agent decisions together under All, newest first", () => {
    render(<FarmingActivity activities={activities} isLoading={false} policyItems={policyItems} />);

    expect(titles()).toEqual([
      "Agent declined a move",
      "Strategy Changed",
      "Rejected on-chain by Policy Guard",
      "Deposit",
    ]);
    expect(screen.getByText("Gain $0.04 is below cost $0.11")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Replay" })).toHaveAttribute("href", "/activity/d1");
  });

  it("filters to agent decisions only under Policy", () => {
    render(<FarmingActivity activities={activities} isLoading={false} policyItems={policyItems} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Policy" }));
    fireEvent.click(screen.getByRole("tab", { name: "Policy" }));

    expect(titles()).toEqual(["Agent declined a move", "Rejected on-chain by Policy Guard"]);
    const rejected = screen.getByText("Rejected on-chain by Policy Guard").closest("div")
      ?.parentElement as HTMLElement;
    expect(within(rejected).getByRole("link", { name: "TX" })).toHaveAttribute(
      "href",
      policyItems[1]?.txUrl
    );
  });

  it("keeps policy rows out of the Protocol filter", () => {
    render(<FarmingActivity activities={activities} isLoading={false} policyItems={policyItems} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Protocol" }));
    fireEvent.click(screen.getByRole("tab", { name: "Protocol" }));

    expect(titles()).toEqual(["Strategy Changed", "Deposit"]);
  });

  it("explains the empty Policy state", () => {
    render(<FarmingActivity activities={activities} isLoading={false} policyItems={[]} />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Policy" }));
    fireEvent.click(screen.getByRole("tab", { name: "Policy" }));

    expect(screen.getByText("No agent decisions yet")).toBeInTheDocument();
    expect(screen.getByText(/rejected on-chain by Policy Guard/i)).toBeInTheDocument();
  });
});
