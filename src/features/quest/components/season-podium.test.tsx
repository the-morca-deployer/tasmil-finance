import { render, screen } from "@testing-library/react";
import type { SeasonLeaderboardEntry } from "../lib/season-types";
import { SeasonPodium } from "./season-podium";

const entries: SeasonLeaderboardEntry[] = [
  {
    rank: 1,
    userId: "u1",
    username: "alice",
    walletAddress: "GAAA1111",
    seasonPoints: 18420,
    usdcReward: "50",
    pointsReward: 5000,
  },
  {
    rank: 2,
    userId: "u2",
    username: "bob",
    walletAddress: "GBBB2222",
    seasonPoints: 16110,
    usdcReward: "20",
    pointsReward: 3000,
  },
  {
    rank: 3,
    userId: "u3",
    username: "carol",
    walletAddress: "GCCC3333",
    seasonPoints: 14980,
    usdcReward: "10",
    pointsReward: 2000,
  },
];

describe("SeasonPodium", () => {
  it("renders all three podium slots with usernames and formatted points", () => {
    render(<SeasonPodium entries={entries} />);
    expect(screen.getByTestId("podium-rank-1")).toBeInTheDocument();
    expect(screen.getByTestId("podium-rank-2")).toBeInTheDocument();
    expect(screen.getByTestId("podium-rank-3")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("carol")).toBeInTheDocument();
    expect(screen.getByText("18,420")).toBeInTheDocument();
  });

  it("places rank #1 in the center slot", () => {
    render(<SeasonPodium entries={entries} />);
    const slots = screen.getAllByTestId(/podium-rank-/);
    // visual order is [2, 1, 3]
    expect(slots[1]).toHaveAttribute("data-testid", "podium-rank-1");
  });

  it("renders gracefully with fewer than three entries", () => {
    render(<SeasonPodium entries={entries.slice(0, 1)} />);
    expect(screen.getByTestId("podium-rank-1")).toBeInTheDocument();
    expect(screen.queryByTestId("podium-rank-2")).not.toBeInTheDocument();
  });
});
