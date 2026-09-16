// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import { EarnDiscoveryCard } from "../earn-discovery-card";

const POOL_A = "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE";
const POOL_B = "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK";

const opportunity = (overrides = {}) => ({
  protocol: "aquarius",
  type: "lp",
  name: "XLM / USDC",
  apy: 12.5,
  tvl: "2850",
  assets: ["XLM", "USDC"],
  risk: "medium",
  poolAddress: POOL_A,
  status: "ok",
  ...overrides,
});

const result = (opportunities: unknown[]) => ({
  opportunities,
  count: opportunities.length,
  totalScanned: opportunities.length,
});

describe("EarnDiscoveryCard", () => {
  it("renders the full pool contract address for an opportunity", () => {
    render(<EarnDiscoveryCard result={result([opportunity()])} status="complete" />);
    const node = screen.getByText(POOL_A);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders an address for every opportunity in the list", () => {
    render(
      <EarnDiscoveryCard
        result={result([
          opportunity(),
          opportunity({ name: "XLM / EURC", poolAddress: POOL_B, apy: 9.1 }),
        ])}
        status="complete"
      />
    );
    expect(screen.getByText(POOL_A)).toBeInTheDocument();
    expect(screen.getByText(POOL_B)).toBeInTheDocument();
  });

  it("renders the address for lending markets, which are mapped to opportunities", () => {
    render(
      <EarnDiscoveryCard
        result={{
          markets: [
            {
              protocol: "blend",
              asset: "USDC",
              supplyApy: 7.3,
              borrowApy: 9.8,
              collateralFactor: 0.9,
              utilization: 62,
              available: "120000",
              poolAddress: POOL_A,
              status: "ok",
            },
          ],
        }}
        status="complete"
      />
    );
    expect(screen.getByText(POOL_A)).toBeInTheDocument();
  });

  it("omits the address element when the opportunity carries no poolAddress", () => {
    render(
      <EarnDiscoveryCard
        result={result([opportunity({ poolAddress: undefined })])}
        status="complete"
      />
    );
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
    expect(screen.queryByText(/^C[A-Z0-9]{55}$/)).not.toBeInTheDocument();
  });

  it("exposes a card test id so E2E card scraping can see its content", () => {
    render(<EarnDiscoveryCard result={result([opportunity()])} status="complete" />);
    expect(screen.getByTestId("card-earn-discovery")).toBeInTheDocument();
  });
});
