import { render, screen } from "@testing-library/react";
import { UserGrowthChart } from "../components/user-growth-chart";
import { VolumeTvlChart } from "../components/volume-tvl-chart";

describe("VolumeTvlChart", () => {
  it("renders the title and empty state", () => {
    render(<VolumeTvlChart data={[]} isLoading={false} />);

    expect(screen.getByText("Volume & TVL — last 90 days")).toBeInTheDocument();
    expect(screen.getByText("No volume data yet")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    render(<VolumeTvlChart data={undefined} isLoading={true} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});

describe("UserGrowthChart", () => {
  it("renders the title and empty state", () => {
    render(<UserGrowthChart data={[]} isLoading={false} />);

    expect(screen.getByText("App wallet growth — last 90 days")).toBeInTheDocument();
    expect(screen.getByText("No user data yet")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    render(<UserGrowthChart data={undefined} isLoading={true} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});
