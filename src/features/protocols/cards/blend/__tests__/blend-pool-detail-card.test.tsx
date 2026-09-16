// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { PoolCardProps } from "@/features/protocols/schemas/blend.schema";
import { BlendPoolDetailCard } from "../blend-pool-detail-card";

const ADDRESS = "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD";

const makePool = (overrides: Partial<PoolCardProps> = {}): PoolCardProps => ({
  address: ADDRESS,
  name: "Fixed Pool",
  status: "active",
  reserves: [
    {
      assetAddress: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
      symbol: "USDC",
      supplyApy: 0.093,
      borrowApy: 0.125,
    },
  ],
  ...overrides,
});

describe("BlendPoolDetailCard", () => {
  it("renders the full pool contract address in playground mode", () => {
    render(<BlendPoolDetailCard pool={makePool()} mode="playground" />);
    const node = screen.getByText(ADDRESS);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders the full pool contract address in chat mode", () => {
    render(<BlendPoolDetailCard pool={makePool()} mode="chat" />);
    const node = screen.getByText(ADDRESS);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("does not render the truncated ellipsis form of the address", () => {
    // Both branches used to render trunc(pool.address), which cannot be
    // matched against an address quoted in the assistant's prose.
    render(<BlendPoolDetailCard pool={makePool()} mode="chat" />);
    // trunc() joins head/tail with U+2026 HORIZONTAL ELLIPSIS.
    expect(screen.queryByText(/…/)).not.toBeInTheDocument();
  });

  it("still renders the pool name and reserves", () => {
    render(<BlendPoolDetailCard pool={makePool()} mode="playground" />);
    expect(screen.getByText("Fixed Pool")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
  });

  it("exposes a card test id so E2E card scraping can see its content", () => {
    render(<BlendPoolDetailCard pool={makePool()} mode="chat" />);
    expect(screen.getByTestId("card-blend-pool-detail")).toBeInTheDocument();
  });
});
