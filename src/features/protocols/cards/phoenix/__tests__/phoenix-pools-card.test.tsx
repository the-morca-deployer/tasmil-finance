import { render, screen } from "@testing-library/react";
import {
  PHOENIX_RESOLVE_POOL,
  PHOENIX_RESOLVE_POOL_PAIR,
} from "@/features/protocols/__fixtures__/mcp-tool-outputs";
import { normalizePhoenixPoolsFromMcp } from "@/features/protocols/adapters/phoenix-from-mcp";
import { PhoenixPoolsCard } from "../phoenix-pools-card";

describe("PhoenixPoolsCard", () => {
  it("labels itself Phoenix, never Blend", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    render(<PhoenixPoolsCard pools={pools} mode="playground" />);
    expect(screen.getByText("Phoenix Pools")).toBeInTheDocument();
    expect(screen.queryByText(/Blend/)).not.toBeInTheDocument();
  });

  it("does not invent an 'unknown' status badge", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    render(<PhoenixPoolsCard pools={pools} mode="playground" />);
    expect(screen.queryByText("unknown")).not.toBeInTheDocument();
  });

  it("renders the full 56-char pool address for every pool", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    render(<PhoenixPoolsCard pools={pools} mode="playground" />);
    for (const pool of pools) {
      const node = screen.getByText(pool.address);
      expect(node).toBeInTheDocument();
      expect(node.textContent).toHaveLength(56);
    }
  });

  it("renders the stake contract of the expanded pool in full", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    render(<PhoenixPoolsCard pools={pools} mode="playground" />);
    const stake = "CAF3UJ45ZQJP6USFUIMVMGOUETUTXEC35R2247VJYIVQBGKTKBZKNBJ3";
    const node = screen.getByText(stake);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
    expect(screen.getByText(/stake contract/i)).toBeInTheDocument();
  });

  it("renders fee basis points as a percentage", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    render(<PhoenixPoolsCard pools={pools} mode="playground" />);
    expect(screen.getAllByText("0.50% fee").length).toBeGreaterThan(0);
  });

  it("renders LP share token and token contracts for the single-pair shape", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL_PAIR);
    render(<PhoenixPoolsCard pools={pools} mode="playground" />);
    expect(
      screen.getByText("CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM")
    ).toBeInTheDocument();
    expect(
      screen.getByText("CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA")
    ).toBeInTheDocument();
    expect(
      screen.getByText("CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75")
    ).toBeInTheDocument();
  });

  it("renders an empty state rather than crashing on no pools", () => {
    render(<PhoenixPoolsCard pools={[]} mode="playground" />);
    expect(screen.getByText("No pools found")).toBeInTheDocument();
  });
});
