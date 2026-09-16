import {
  PHOENIX_RESOLVE_POOL,
  PHOENIX_RESOLVE_POOL_PAIR,
} from "../../__fixtures__/mcp-tool-outputs";
import { normalizePhoenixPoolsFromMcp } from "../phoenix-from-mcp";

describe("normalizePhoenixPoolsFromMcp", () => {
  it("normalizes the pool-list shape", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    expect(pools).toHaveLength(2);
    expect(pools[0]!.address).toBe("CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UABET4MIW52N4EVU6BIZX");
    expect(pools[0]!.name).toBe("XLM/USDC");
  });

  it("keeps the stake contract, which the Blend adapter dropped", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    expect(pools[0]!.stakeAddress).toBe("CAF3UJ45ZQJP6USFUIMVMGOUETUTXEC35R2247VJYIVQBGKTKBZKNBJ3");
    expect(pools[1]!.stakeAddress).toBe("CBRGNWGAC25CPLMOAMR7WBPOF5QTFA5RYXQH4DEJ4K65G2QFLTLMW7RO");
    // The stake contract must never be confused with the pool contract.
    expect(pools[0]!.stakeAddress).not.toBe(pools[0]!.address);
  });

  it("coerces the string feeBps that MCP sends into a number", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL);
    expect(pools[0]!.feeBps).toBe(50);
  });

  it("normalizes the single-pair shape that has no pools array", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL_PAIR);
    expect(pools).toHaveLength(1);
    expect(pools[0]!.address).toBe("CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UABET4MIW52N4EVU6BIZX");
    expect(pools[0]!.stakeAddress).toBe("CAF3UJ45ZQJP6USFUIMVMGOUETUTXEC35R2247VJYIVQBGKTKBZKNBJ3");
    expect(pools[0]!.lpShareAddress).toBe(
      "CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM"
    );
  });

  it("derives a name from the token pair when the payload has none", () => {
    const pools = normalizePhoenixPoolsFromMcp(PHOENIX_RESOLVE_POOL_PAIR);
    expect(pools[0]!.name).toBe("XLM/USDC");
    expect(pools[0]!.tokens).toHaveLength(2);
  });

  it("returns an empty list for an error or unrelated payload", () => {
    expect(normalizePhoenixPoolsFromMcp([{ type: "text", text: "not json{{{" }])).toEqual([]);
    expect(normalizePhoenixPoolsFromMcp({ success: false, error: "boom" })).toEqual([]);
  });
});
