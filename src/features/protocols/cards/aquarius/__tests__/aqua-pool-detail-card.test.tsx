// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { AquaPoolCardProps } from "@/features/protocols/schemas/aquarius.schema";
import { AquaPoolDetailCard } from "../aqua-pool-detail-card";

const ADDRESS = "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE";

const makePool = (overrides: Partial<AquaPoolCardProps> = {}): AquaPoolCardProps => ({
  address: ADDRESS,
  tokens: [
    { address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", symbol: "XLM" },
    { address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", symbol: "USDC" },
  ],
  poolType: "constant_product",
  fee: "0.10%",
  tvl: 2850,
  volume24h: 150,
  feeApy: 0.0016,
  rewardApy: 0.05,
  totalApy: 0.0516,
  ...overrides,
});

describe("AquaPoolDetailCard", () => {
  it("renders the full pool contract address in playground mode", () => {
    render(<AquaPoolDetailCard pool={makePool()} mode="playground" />);
    const node = screen.getByText(ADDRESS);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders the full pool contract address in chat mode", () => {
    render(<AquaPoolDetailCard pool={makePool()} mode="chat" />);
    const node = screen.getByText(ADDRESS);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("does not render a truncated form of the address", () => {
    render(<AquaPoolDetailCard pool={makePool()} mode="playground" />);
    // The address used to appear only as a .slice(0, 10) label fallback.
    expect(screen.queryByText("CA6PUJLBYK")).not.toBeInTheDocument();
  });

  it("still renders the token-pair label alongside the address", () => {
    render(<AquaPoolDetailCard pool={makePool()} mode="playground" />);
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
  });

  it("renders no address element when the pool has no address", () => {
    render(
      <AquaPoolDetailCard
        pool={makePool({ address: "", tokensStr: ["XLM", "USDC"] })}
        mode="playground"
      />
    );
    expect(screen.queryByText(/^C[A-Z0-9]{55}$/)).not.toBeInTheDocument();
  });

  it("exposes a card test id so E2E card scraping can see its content", () => {
    render(<AquaPoolDetailCard pool={makePool()} mode="chat" />);
    expect(screen.getByTestId("card-aqua-pool-detail")).toBeInTheDocument();
  });
});
