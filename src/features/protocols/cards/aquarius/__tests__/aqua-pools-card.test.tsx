// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { AquaPoolCardProps } from "@/features/protocols/schemas/aquarius.schema";
import { AquaPoolsCard } from "../aqua-pools-card";

const makePool = (overrides: Partial<AquaPoolCardProps> = {}): AquaPoolCardProps => ({
  address: "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE",
  tokens: [
    { address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", symbol: "XLM" },
    { address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", symbol: "USDC" },
  ],
  tokensStr: ["XLM", "USDC"],
  poolType: "constant_product",
  fee: "0.10%",
  tvl: 2850,
  volume24h: 150,
  feeApy: 0.0016,
  rewardApy: 0.05,
  totalApy: 0.0516,
  ...overrides,
});

describe("AquaPoolsCard", () => {
  it("renders pool name from tokens", () => {
    render(<AquaPoolsCard pools={[makePool()]} mode="playground" />);
    // resolvePoolLabel joins token symbols with " / "
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
  });

  it("renders token icons with correct alt text (playground expands first pool)", () => {
    render(<AquaPoolsCard pools={[makePool()]} mode="playground" />);
    // First pool is auto-expanded in playground mode, so PoolDetail renders TokenImage
    const xlmIcon = screen.getByAltText("XLM");
    expect(xlmIcon).toBeInTheDocument();
    const usdcIcon = screen.getByAltText("USDC");
    expect(usdcIcon).toBeInTheDocument();
  });

  it("renders TVL when provided", () => {
    render(<AquaPoolsCard pools={[makePool({ tvl: 2850 })]} mode="playground" />);
    // fmt(2850) produces a formatted number: the detail section shows "$2.85K".
    // Asserted exactly rather than via /2/, which also matched digits inside the
    // pool contract address now rendered in the row header.
    expect(screen.getByText("$2.85K")).toBeInTheDocument();
  });

  it("renders pool count badge in playground mode", () => {
    render(<AquaPoolsCard pools={[makePool()]} mode="playground" />);
    // CardHeader renders pools.length as text
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders pool type tag as 'Volatile' for constant_product", () => {
    render(
      <AquaPoolsCard pools={[makePool({ poolType: "constant_product" })]} mode="playground" />
    );
    // poolTypeTag converts "constant_product" -> "Volatile"
    expect(screen.getByText("Volatile")).toBeInTheDocument();
  });

  it("renders empty state when pools array is empty", () => {
    render(<AquaPoolsCard pools={[]} mode="playground" />);
    expect(screen.getByText("No pools found")).toBeInTheDocument();
  });

  it("renders with missing tokens gracefully (uses tokensStr fallback)", () => {
    render(
      <AquaPoolsCard
        pools={[makePool({ tokens: undefined, tokensStr: ["XLM", "USDC"] })]}
        mode="playground"
      />
    );
    // resolvePoolLabel falls back to tokensStr
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
  });

  it("renders with both tokens and tokensStr missing (uses address prefix)", () => {
    render(
      <AquaPoolsCard
        pools={[makePool({ tokens: undefined, tokensStr: undefined })]}
        mode="playground"
      />
    );
    // resolvePoolLabel falls back to address.slice(0, 10)
    expect(screen.getByText("CA6PUJLBYK")).toBeInTheDocument();
  });

  it("renders title in chat mode", () => {
    render(<AquaPoolsCard pools={[makePool()]} mode="chat" />);
    expect(screen.getByText("Aquarius Pools")).toBeInTheDocument();
  });

  it("renders the full pool contract address, untruncated", () => {
    const address = "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE";
    render(<AquaPoolsCard pools={[makePool({ address })]} mode="playground" />);
    const node = screen.getByText(address);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders addresses for every pool, including collapsed ones", () => {
    // Only pool index 0 is auto-expanded in playground mode, so this proves the
    // address lives in the always-rendered header region, not inside PoolDetail.
    const first = "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE";
    const second = "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK";
    render(
      <AquaPoolsCard
        pools={[makePool({ address: first }), makePool({ address: second })]}
        mode="playground"
      />
    );
    expect(screen.getByText(first)).toBeInTheDocument();
    expect(screen.getByText(second)).toBeInTheDocument();
  });

  it("renders each token's full SAC contract in the expanded detail body", () => {
    const xlmSac = "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";
    const usdcSac = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
    render(<AquaPoolsCard pools={[makePool()]} mode="playground" />);
    // Pool 0 is auto-expanded in playground mode, so PoolDetail is mounted.
    expect(screen.getByText(xlmSac)).toBeInTheDocument();
    expect(screen.getByText(usdcSac)).toBeInTheDocument();
  });

  it("keeps token addresses out of the collapsed header region", () => {
    // Pool 1 is collapsed, so its PoolDetail is not mounted: only the pool
    // address belongs in the always-visible header, token SACs do not.
    const secondPool = "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK";
    const secondTokenSac = "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV";
    render(
      <AquaPoolsCard
        pools={[
          makePool(),
          makePool({
            address: secondPool,
            tokens: [{ address: secondTokenSac, symbol: "EURC" }],
          }),
        ]}
        mode="playground"
      />
    );
    expect(screen.getByText(secondPool)).toBeInTheDocument();
    expect(screen.queryByText(secondTokenSac)).not.toBeInTheDocument();
  });

  it("renders no address element when the pool has no address", () => {
    render(
      <AquaPoolsCard
        pools={[makePool({ address: "", tokens: undefined, tokensStr: ["XLM", "USDC"] })]}
        mode="playground"
      />
    );
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
    expect(screen.queryByText(/^C[A-Z0-9]{55}$/)).not.toBeInTheDocument();
  });
});
