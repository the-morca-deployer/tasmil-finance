import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WelcomeRewardCard } from "./welcome-reward-card";

describe("WelcomeRewardCard", () => {
  it("renders compact reward status content and opens the reward page CTA", async () => {
    const user = userEvent.setup();
    const onOpen = jest.fn();

    render(
      <WelcomeRewardCard
        status={{
          reserved: true,
          welcomeCardSeen: false,
          currentVolumeUsd: 0,
          targetVolumeUsd: 10,
          progressPercent: 0,
          unlocked: false,
          unlockedAt: null,
        }}
        onOpen={onOpen}
      />
    );

    expect(screen.getByText("Welcome reward")).toBeInTheDocument();
    expect(
      screen.getByText("You're one of the earliest users. A reward has been reserved for you.")
    ).toBeInTheDocument();
    expect(screen.getByText("Trade ≥ $10 volume to unlock")).toBeInTheDocument();
    expect(screen.getByText("Tracked volume")).toBeInTheDocument();
    expect(screen.getByText("$0.00 / $10.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view reward progress/i }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
