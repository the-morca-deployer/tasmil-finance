import { render, screen } from "@testing-library/react";
import type { CampaignCardData } from "./CampaignCard";
import { CampaignCard } from "./CampaignCard";

const base: CampaignCardData = {
  id: "soroswap-x",
  title: "Swap & Earn",
  sponsor: "Stellar",
  pointsReward: 350,
  status: "ongoing",
  endsAt: "2026-12-31",
  coverUrl: null,
  description: "Swap on Soroswap to earn points.",
  participants: 1200,
};

describe("CampaignCard", () => {
  it("links to the campaign detail route", () => {
    render(<CampaignCard campaign={base} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/quest/campaign/soroswap-x");
  });

  it("renders title, points and Ongoing CTA", () => {
    render(<CampaignCard campaign={base} />);
    expect(screen.getByText("Swap & Earn")).toBeInTheDocument();
    expect(screen.getByText(/\+350/)).toBeInTheDocument();
    expect(screen.getByText("Start Quest")).toBeInTheDocument();
    expect(screen.getByText("Ongoing")).toBeInTheDocument();
  });

  it("shows Closed state with View CTA", () => {
    render(<CampaignCard campaign={{ ...base, status: "closed" }} />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });
});
