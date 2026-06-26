import { render, screen } from "@testing-library/react";
import { PrizePoolBanner } from "./prize-pool-banner";

describe("PrizePoolBanner", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-20T00:00:00.000Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const future = new Date(Date.now() + 5 * 86_400 * 1000).toISOString();

  it("renders the USDC prize pool and points pool figures", () => {
    render(
      <PrizePoolBanner
        prizePoolUsdc="80"
        totalPointsPool={13500}
        endAt={future}
        playersCount={247}
      />
    );
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText(/USDC/i)).toBeInTheDocument();
    expect(screen.getByText(/13,500/)).toBeInTheDocument();
    expect(screen.getByText(/247/)).toBeInTheDocument();
  });

  it("renders the four countdown unit labels", () => {
    render(
      <PrizePoolBanner prizePoolUsdc="80" totalPointsPool={13500} endAt={future} playersCount={1} />
    );
    expect(screen.getByText(/Days/i)).toBeInTheDocument();
    expect(screen.getByText(/Hrs/i)).toBeInTheDocument();
    expect(screen.getByText(/Min/i)).toBeInTheDocument();
    expect(screen.getByText(/Sec/i)).toBeInTheDocument();
  });
});
