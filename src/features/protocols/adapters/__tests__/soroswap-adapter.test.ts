import {
  EMPTY_MCP_RESULT,
  SOROSWAP_RESOLVE_POOL,
  SOROSWAP_RESOLVE_POOL_OBJECT_TOKENS,
} from "../../__fixtures__/mcp-tool-outputs";
import { normalizeSoroswapPoolsFromMcp } from "../soroswap-from-mcp";

describe("Soroswap MCP Adapter", () => {
  describe("normalizeSoroswapPoolsFromMcp", () => {
    it("extracts token symbols from string format", () => {
      const pools = normalizeSoroswapPoolsFromMcp(SOROSWAP_RESOLVE_POOL);
      expect(pools).toHaveLength(1);
      expect(pools[0]!.tokenA).toBe("XLM");
      expect(pools[0]!.tokenB).toBe("USDC");
    });

    it("extracts pool address", () => {
      const pools = normalizeSoroswapPoolsFromMcp(SOROSWAP_RESOLVE_POOL);
      expect(pools[0]!.address).toBe("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F");
    });

    it("extracts TVL", () => {
      const pools = normalizeSoroswapPoolsFromMcp(SOROSWAP_RESOLVE_POOL);
      expect(pools[0]!.tvl).toBe(560.0);
    });

    it("BUG: tokenA as object produces [object Object] in token names", () => {
      // Documents the CURRENT BUG: MCP returns tokenA as {address, symbol} object
      // but the adapter calls String(pool.tokenA) which produces "[object Object]".
      // resolveSymbol passes it through unchanged (not a contract address format),
      // so the pool survives Zod validation but with garbage token names.
      // After fixing the adapter to extract .symbol from object tokens, update
      // this test to expect correct symbols ("XLM", "USDC").
      const pools = normalizeSoroswapPoolsFromMcp(SOROSWAP_RESOLVE_POOL_OBJECT_TOKENS);
      expect(pools).toHaveLength(1);
      const pool = pools[0]!;
      // BUG: token names are "[object Object]" instead of "XLM" / "USDC"
      expect(pool.tokenA).toBe("[object Object]");
      expect(pool.tokenB).toBe("[object Object]");
    });

    it("extracts token addresses", () => {
      const pools = normalizeSoroswapPoolsFromMcp(SOROSWAP_RESOLVE_POOL);
      expect(pools[0]!.tokenAAddress).toBe(
        "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"
      );
      expect(pools[0]!.tokenBAddress).toBe(
        "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"
      );
    });

    it("returns empty array for error result", () => {
      const pools = normalizeSoroswapPoolsFromMcp(EMPTY_MCP_RESULT);
      expect(pools).toEqual([]);
    });
  });
});
