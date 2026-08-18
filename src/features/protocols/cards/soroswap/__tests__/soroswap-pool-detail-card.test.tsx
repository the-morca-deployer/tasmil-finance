// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { SoroswapPoolCardProps } from "@/features/protocols/schemas/soroswap.schema";
import { SoroswapPoolDetailCard } from "../soroswap-pool-detail-card";

const ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F";

const makePool = (overrides: Partial<SoroswapPoolCardProps> = {}): SoroswapPoolCardProps => ({
  address: ADDRESS,
  tokenA: "XLM",
  tokenB: "USDC",
  reserveA: 1000000000,
  reserveB: 280000000,
  tvl: 560,
  fee: "0.30%",
  ...overrides,
});

describe("SoroswapPoolDetailCard", () => {
  it("renders the full pool contract address in playground mode", () => {
    render(<SoroswapPoolDetailCard pool={makePool()} mode="playground" />);
    const node = screen.getByText(ADDRESS);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders the full pool contract address in chat mode", () => {
    render(<SoroswapPoolDetailCard pool={makePool()} mode="chat" />);
    const node = screen.getByText(ADDRESS);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders no address element when the pool has no address", () => {
    // `address` is optional on soroswapPoolCardPropsSchema.
    render(<SoroswapPoolDetailCard pool={makePool({ address: undefined })} mode="playground" />);
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
    expect(screen.queryByText(/^C[A-Z0-9]{55}$/)).not.toBeInTheDocument();
  });

  it("exposes a card test id so E2E card scraping can see its content", () => {
    render(<SoroswapPoolDetailCard pool={makePool()} mode="chat" />);
    expect(screen.getByTestId("card-soroswap-pool-detail")).toBeInTheDocument();
  });
});
