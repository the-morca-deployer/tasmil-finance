// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { SoroswapPoolCardProps } from "@/features/protocols/schemas/soroswap.schema";
import { SoroswapPoolsCard } from "../soroswap-pools-card";

const makePool = (overrides: Partial<SoroswapPoolCardProps> = {}): SoroswapPoolCardProps => ({
  address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
  tokenA: "XLM",
  tokenB: "USDC",
  tokenAAddress: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  tokenBAddress: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  reserveA: 1000000000,
  reserveB: 280000000,
  tvl: 560,
  fee: "0.30%",
  ...overrides,
});

describe("SoroswapPoolsCard", () => {
  it("renders token pair label", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    // Label is `${pool.tokenA} / ${pool.tokenB}`
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
  });

  it("renders token icons in expanded detail (playground auto-expands first)", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByAltText("XLM")).toBeInTheDocument();
    expect(screen.getByAltText("USDC")).toBeInTheDocument();
  });

  it("does NOT show [object Object] for token names", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    const text = document.body.textContent || "";
    expect(text).not.toContain("[object Object]");
  });

  it("renders pool count in playground mode", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders empty state when pools array is empty", () => {
    render(<SoroswapPoolsCard pools={[]} mode="playground" />);
    expect(screen.getByText("No pools found")).toBeInTheDocument();
  });

  it("renders with missing optional fields (tvl, fee)", () => {
    render(
      <SoroswapPoolsCard pools={[makePool({ tvl: undefined, fee: undefined })]} mode="playground" />
    );
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
  });

  it("renders title in chat mode", () => {
    render(<SoroswapPoolsCard pools={[makePool()]} mode="chat" />);
    expect(screen.getByText("Soroswap Pools")).toBeInTheDocument();
  });

  it("renders the full pool contract address, untruncated", () => {
    const address = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F";
    render(<SoroswapPoolsCard pools={[makePool({ address })]} mode="playground" />);
    const node = screen.getByText(address);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders addresses for every pool, including collapsed ones", () => {
    // Only pool 0 auto-expands in playground mode, so this proves the address
    // lives in the always-rendered header region, not inside PoolDetail.
    const first = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F";
    const second = "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK";
    render(
      <SoroswapPoolsCard
        pools={[makePool({ address: first }), makePool({ address: second })]}
        mode="playground"
      />
    );
    expect(screen.getByText(first)).toBeInTheDocument();
    expect(screen.getByText(second)).toBeInTheDocument();
  });

  it("renders no address element when the pool has no address", () => {
    // `address` is optional on soroswapPoolCardPropsSchema, unlike blend/aqua,
    // so the header must guard on it rather than rendering an empty span.
    render(
      <SoroswapPoolsCard
        pools={[
          makePool({ address: undefined, tokenAAddress: undefined, tokenBAddress: undefined }),
        ]}
        mode="playground"
      />
    );
    expect(screen.getByText("XLM / USDC")).toBeInTheDocument();
    expect(screen.queryByText(/^C[A-Z0-9]{55}$/)).not.toBeInTheDocument();
  });

  it("renders both token SAC contracts in the expanded detail body", () => {
    const xlmSac = "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";
    const usdcSac = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
    render(<SoroswapPoolsCard pools={[makePool()]} mode="playground" />);
    expect(screen.getByText(xlmSac)).toBeInTheDocument();
    expect(screen.getByText(usdcSac)).toBeInTheDocument();
  });

  it("keeps token addresses out of the collapsed header region", () => {
    const second = "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK";
    const secondTokenSac = "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV";
    render(
      <SoroswapPoolsCard
        pools={[
          makePool(),
          makePool({
            address: second,
            tokenB: "EURC",
            tokenBAddress: secondTokenSac,
          }),
        ]}
        mode="playground"
      />
    );
    expect(screen.getByText(second)).toBeInTheDocument();
    expect(screen.queryByText(secondTokenSac)).not.toBeInTheDocument();
  });
});
