import { fireEvent, render, screen } from "@testing-library/react";
import { RankReveal } from "../RankReveal";

describe("RankReveal", () => {
  it("renders real reward data and fires onClaim", () => {
    const onClaim = jest.fn();
    render(
      <RankReveal
        open
        rank={1}
        usdcReward="50"
        pointsReward={5000}
        badge="gold"
        seasonName="June 2026"
        onClaim={onClaim}
      />
    );
    expect(screen.getByText(/June 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/50 USDC/i)).toBeInTheDocument();
    expect(screen.getByText(/5,000 PTS/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /claim/i }));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it("omits the USDC line when reward is 0", () => {
    render(
      <RankReveal
        open
        rank={7}
        usdcReward="0"
        pointsReward={800}
        badge="aqua"
        seasonName="June 2026"
        onClaim={jest.fn()}
      />
    );
    expect(screen.queryByText(/USDC/i)).not.toBeInTheDocument();
    expect(screen.getByText(/800 PTS/i)).toBeInTheDocument();
  });
});
