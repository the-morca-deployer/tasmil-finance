import { render, screen } from "@testing-library/react";
import { AccountInfoCard } from "./account-info-card";

it("shows Blend asset and amount from get_account positions", () => {
  render(
    <AccountInfoCard
      args={{ query: "positions" }}
      result={{
        success: true,
        count: 1,
        positions: [
          {
            protocol: "blend",
            type: "supply",
            pool: "Etherfuse Pool",
            asset: "XLM",
            amount: "50.0082",
            isCollateral: true,
          },
        ],
      }}
    />
  );

  expect(screen.getByText("Etherfuse Pool")).toBeInTheDocument();
  expect(screen.getByText("XLM")).toBeInTheDocument();
  expect(screen.getByText("50.0082")).toBeInTheDocument();
});
