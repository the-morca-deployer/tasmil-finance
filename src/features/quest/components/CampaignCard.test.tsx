import { render, screen } from "@testing-library/react";
import type { Campaign } from "@/features/quest/types";
import { CampaignCard } from "./CampaignCard";

const base: Campaign = {
  id: "soroswap-x",
  title: "Swap & Earn",
  description: "Swap on Soroswap to earn points.",
  status: "ongoing",
  banner: "",
  participants: 1200,
  points: 350,
  chain: "Stellar",
};

describe("CampaignCard", () => {
  it("links to the production campaign detail route", () => {
    render(<CampaignCard campaign={base} />);
    const card = screen.getByTestId("campaign-card");
    expect(card).toHaveAttribute("href", "/quest/campaign/soroswap-x");
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
