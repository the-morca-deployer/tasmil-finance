// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { PoolCardProps } from "@/features/protocols/schemas/blend.schema";
import { BlendPoolsCard } from "../blend-pools-card";

const makePool = (overrides: Partial<PoolCardProps> = {}): PoolCardProps => ({
  address: "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
  name: "Fixed Pool",
  status: "active",
  reserves: [
    {
      assetAddress: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
      symbol: "USDC",
      supplyApy: 0.093,
      borrowApy: 0.125,
    },
    {
      assetAddress: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
      symbol: "XLM",
      supplyApy: 0.052,
      borrowApy: 0.081,
    },
  ],
  ...overrides,
});

describe("BlendPoolsCard", () => {
  it("renders pool name", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText("Fixed Pool")).toBeInTheDocument();
  });

  it("renders reserve symbols in expanded detail", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    // Playground auto-expands first pool, ReserveList shows token symbols
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });

  it("renders pool status as tag", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    // Tag maps "active" -> "Active"
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders pool count in playground mode", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders with empty reserves (pool still shows, but no reserve detail)", () => {
    render(<BlendPoolsCard pools={[makePool({ reserves: [] })]} mode="playground" />);
    expect(screen.getByText("Fixed Pool")).toBeInTheDocument();
  });

  it("renders empty state when pools array is empty", () => {
    render(<BlendPoolsCard pools={[]} mode="playground" />);
    expect(screen.getByText("No pools found")).toBeInTheDocument();
  });

  it("renders token icons with correct alt text", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByAltText("USDC")).toBeInTheDocument();
    expect(screen.getByAltText("XLM")).toBeInTheDocument();
  });

  it("renders title in chat mode", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="chat" />);
    expect(screen.getByText("Blend Pools")).toBeInTheDocument();
  });

  it("renders the full pool contract address, untruncated", () => {
    const address = "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD";
    render(<BlendPoolsCard pools={[makePool({ address })]} mode="playground" />);
    const node = screen.getByText(address);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders addresses for every pool, including collapsed ones", () => {
    // Only pool 0 auto-expands in playground mode, so this proves the address
    // lives in the always-rendered header region, not inside ReserveList.
    const first = "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD";
    const second = "CBP7NO6F7FRDHSOFQBT2L2UWYIZ2PU76JKVRYAQTG3KZSQLYAOKIF2WB";
    render(
      <BlendPoolsCard
        pools={[makePool({ address: first }), makePool({ address: second })]}
        mode="playground"
      />
    );
    expect(screen.getByText(first)).toBeInTheDocument();
    expect(screen.getByText(second)).toBeInTheDocument();
  });

  it("renders each reserve's full asset contract in the expanded detail body", () => {
    const usdc = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
    const xlm = "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText(usdc)).toBeInTheDocument();
    expect(screen.getByText(xlm)).toBeInTheDocument();
  });

  it("renders the protocol-wide contracts resolve_pool returns", () => {
    // These arrive as top-level fields on the blend resolve_pool result. No
    // card rendered them, so the model quoting a real backstop address looked
    // like a fabrication to anything comparing prose against the card.
    const registry = {
      network: "mainnet",
      backstopAddress: "CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7",
      blndToken: "CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY",
      blndAssetCode: "BLND",
      blndAssetIssuer: "GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY",
      cometLpToken: "CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM",
    };
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" registry={registry} />);
    for (const address of [
      registry.backstopAddress,
      registry.blndToken,
      registry.cometLpToken,
      registry.blndAssetIssuer,
    ]) {
      const node = screen.getByText(address);
      expect(node).toBeInTheDocument();
      expect(node.textContent).toHaveLength(56);
    }
    expect(screen.getByText("Backstop")).toBeInTheDocument();
    expect(screen.getByText("BLND token")).toBeInTheDocument();
    expect(screen.getByText("Comet LP token")).toBeInTheDocument();
  });

  it("omits the contracts section entirely when no registry is passed", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.queryByText("Protocol contracts")).not.toBeInTheDocument();
  });

  it("skips registry rows the tool did not return", () => {
    render(
      <BlendPoolsCard
        pools={[makePool()]}
        mode="playground"
        registry={{
          backstopAddress: "CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7",
          blndToken: null,
          cometLpToken: null,
        }}
      />
    );
    expect(screen.getByText("Backstop")).toBeInTheDocument();
    expect(screen.queryByText("BLND token")).not.toBeInTheDocument();
    expect(screen.queryByText("Comet LP token")).not.toBeInTheDocument();
  });

  it("titles itself from the protocol it was given, not from its own name", () => {
    render(<BlendPoolsCard pools={[makePool()]} mode="playground" protocol="phoenix" />);
    expect(screen.getByText("Phoenix Pools")).toBeInTheDocument();
    expect(screen.queryByText("Blend Pools")).not.toBeInTheDocument();
  });

  it("keeps reserve asset addresses out of the collapsed header region", () => {
    const second = "CBP7NO6F7FRDHSOFQBT2L2UWYIZ2PU76JKVRYAQTG3KZSQLYAOKIF2WB";
    const secondAsset = "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV";
    render(
      <BlendPoolsCard
        pools={[
          makePool(),
          makePool({
            address: second,
            reserves: [
              { assetAddress: secondAsset, symbol: "EURC", supplyApy: 0.01, borrowApy: 0.02 },
            ],
          }),
        ]}
        mode="playground"
      />
    );
    expect(screen.getByText(second)).toBeInTheDocument();
    expect(screen.queryByText(secondAsset)).not.toBeInTheDocument();
  });
});
