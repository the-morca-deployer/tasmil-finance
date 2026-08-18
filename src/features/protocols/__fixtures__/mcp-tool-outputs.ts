/**
 * Real MCP tool output fixtures for protocol adapter tests.
 * Each fixture matches the [{type:"text", text: JSON.stringify(...)}] MCP result format.
 */

// --- Aquarius -------------------------------------------------

/** Aquarius resolve_pool - enriched format with token objects and TVL fields */
export const AQUARIUS_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "aquarius",
      pools: [
        {
          poolAddress: "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE",
          name: "XLM/USDC",
          tokens: [
            {
              address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
              symbol: "XLM",
            },
            {
              address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
            },
          ],
          tokens_str: ["native", "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"],
          tokens_addresses: [
            "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
            "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          ],
          poolType: "constant_product",
          fee: "0.0010",
          totalVolume: 1710736044750252,
          liquidity_usd: 28500000000000,
          volume_usd: 1500000000000,
          // resolve_pool converts APY to percent before returning it, and emits
          // camelCase. The old decimal/snake_case values here were what the raw
          // Aquarius API sends, not what MCP does -- which is why these tests
          // never noticed the adapter converting a second time.
          feeApy: 0.16,
          rewardApy: 5,
          totalApy: 5.16,
        },
      ],
      count: 1,
    }),
  },
];

/** Aquarius resolve_pool - BROKEN old format: tokens as plain string addresses, no TVL */
export const AQUARIUS_RESOLVE_POOL_BROKEN = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "aquarius",
      pools: [
        {
          poolAddress: "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE",
          name: "XLM/USDC",
          tokens: [
            "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
            "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          ],
          poolType: "constant_product",
          fee: "0.0010",
          totalVolume: 1710736044750252,
        },
      ],
      count: 1,
    }),
  },
];

// --- Soroswap -------------------------------------------------

/** Soroswap resolve_pool - CURRENT BUG: tokenA/tokenB as objects instead of strings */
export const SOROSWAP_RESOLVE_POOL_OBJECT_TOKENS = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "soroswap",
      pools: [
        {
          poolAddress: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
          tokenA: {
            address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
            symbol: "XLM",
          },
          tokenB: {
            address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
            symbol: "USDC",
          },
          reserveA: "1000000000",
          reserveB: "280000000",
          tvlUsd: 560.0,
          totalFeeBps: 30,
        },
      ],
      count: 1,
    }),
  },
];

/** Soroswap resolve_pool - CORRECT format: tokenA/tokenB as plain strings */
export const SOROSWAP_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "soroswap",
      pools: [
        {
          address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
          tokenA: "XLM",
          tokenB: "USDC",
          token0_address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
          token1_address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          reserveA: "1000000000",
          reserveB: "280000000",
          tvlUsd: 560.0,
          totalFeeBps: 30,
        },
      ],
      count: 1,
    }),
  },
];

// --- Blend ----------------------------------------------------

/** Blend resolve_pool - standard format with reserves array */
export const BLEND_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "blend",
      pools: [
        {
          poolAddress: "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
          name: "Fixed Pool",
          status: "active",
          canSupply: true,
          canBorrow: true,
          reserves: [
            {
              asset: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
              totalSupply: "500000",
              totalBorrow: "120000",
              supplyApy: 9.3,
              borrowApy: 12.5,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.24,
              collateralFactor: 0.75,
              liabilityFactor: 0.8,
              enabled: true,
            },
            {
              asset: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
              symbol: "XLM",
              totalSupply: "1000000",
              totalBorrow: "300000",
              supplyApy: 5.2,
              borrowApy: 8.1,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.3,
              collateralFactor: 0.65,
              liabilityFactor: 0.7,
              enabled: true,
            },
          ],
        },
      ],
      count: 1,
    }),
  },
];

// --- V2 Fixtures: NEW MCP format (card-ready, matches Zod schemas) --

/** Aquarius V2 - matches AquaPoolCardProps schema directly */
export const AQUARIUS_RESOLVE_POOL_V2 = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "aquarius",
      pools: [
        {
          address: "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE",
          poolType: "constant_product",
          tokens: [
            { address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", symbol: "XLM" },
            { address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", symbol: "USDC" },
          ],
          tokensStr: ["XLM", "USDC"],
          fee: "0.10%",
          tvl: 2850,
          volume24h: 150,
          feeApy: 0.16,
          rewardApy: 5.0,
          totalApy: 5.16,
        },
      ],
      count: 1,
    }),
  },
];

/** Soroswap V2 - actual resolveSoroswap() output format */
export const SOROSWAP_RESOLVE_POOL_V2 = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "soroswap",
      pools: [
        {
          address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
          tokenA: "XLM",
          tokenB: "USDC",
          token0_address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
          token1_address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          reserveA: "1000000000",
          reserveB: "280000000",
          tvlUsd: 560.0,
          fee: 0.003,
          totalFeeBps: 30,
        },
      ],
      count: 1,
    }),
  },
];

/** Blend V2 - actual resolveBlend() output format */
export const BLEND_RESOLVE_POOL_V2 = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "blend",
      pools: [
        {
          address: "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
          name: "Fixed Pool",
          status: "active",
          canSupply: true,
          canBorrow: true,
          reserves: [
            {
              asset: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
              totalSupply: "500000",
              totalBorrow: "120000",
              supplyApy: 9.3,
              borrowApy: 12.5,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.24,
              collateralFactor: 0.75,
              liabilityFactor: 0.8,
              enabled: true,
            },
            {
              asset: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
              symbol: "XLM",
              totalSupply: "1000000",
              totalBorrow: "300000",
              supplyApy: 5.2,
              borrowApy: 8.1,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.3,
              collateralFactor: 0.65,
              liabilityFactor: 0.7,
              enabled: true,
            },
          ],
        },
      ],
      count: 1,
    }),
  },
];

/**
 * Blend resolve_pool as mainnet actually returns it: the pool list is preceded
 * by protocol-wide contract IDs that no card used to render. Captured from the
 * live MCP server on :3009.
 */
export const BLEND_RESOLVE_POOL_WITH_REGISTRY = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "blend",
      network: "mainnet",
      backstopAddress: "CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7",
      blndToken: "CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY",
      blndAssetCode: "BLND",
      blndAssetIssuer: "GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY",
      cometLpToken: "CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM",
      pools: [
        {
          address: "CC4HHXPKR3FIXUQEC53MAK2IVWD6APAEBBXP5XCIW5FISN6PQOAC6UXG",
          name: "Solv",
          status: "active",
          canSupply: true,
          canBorrow: true,
          reserves: [
            {
              asset: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
              totalSupply: "500000",
              totalBorrow: "120000",
              supplyApy: 9.3,
              borrowApy: 12.5,
            },
          ],
        },
      ],
      count: 1,
    }),
  },
];

// --- Phoenix -------------------------------------------------

/**
 * Phoenix resolve_pool with no token filter. Note `feeBps` arrives as a
 * string, and every pool carries a `stakeAddress` distinct from its
 * `poolAddress`. Captured from the live MCP server on :3009.
 */
export const PHOENIX_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "phoenix",
      pools: [
        {
          poolAddress: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UABET4MIW52N4EVU6BIZX",
          name: "XLM/USDC",
          stakeAddress: "CAF3UJ45ZQJP6USFUIMVMGOUETUTXEC35R2247VJYIVQBGKTKBZKNBJ3",
          feeBps: "50",
        },
        {
          poolAddress: "CBCZGGNOEUZG4CAAE7TGTQQHETZMKUT4OIPFHHPKEUX46U4KXBBZ3GLH",
          name: "XLM/PHO",
          stakeAddress: "CBRGNWGAC25CPLMOAMR7WBPOF5QTFA5RYXQH4DEJ4K65G2QFLTLMW7RO",
          feeBps: "50",
        },
      ],
      count: 2,
    }),
  },
];

/** Phoenix resolve_pool for a single token pair - no `pools` array at all. */
export const PHOENIX_RESOLVE_POOL_PAIR = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "phoenix",
      poolAddress: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UABET4MIW52N4EVU6BIZX",
      stakeAddress: "CAF3UJ45ZQJP6USFUIMVMGOUETUTXEC35R2247VJYIVQBGKTKBZKNBJ3",
      tokenA: {
        address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
        symbol: "XLM",
        amount: "1000000000",
      },
      tokenB: {
        address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
        symbol: "USDC",
        amount: "250000000",
      },
      lpShareAddress: "CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM",
    }),
  },
];

// --- Templar -------------------------------------------------

/**
 * Templar resolve_pool. Keyed `markets`, and the identifiers are NEAR market
 * ids rather than Stellar contracts. Captured from the live MCP server.
 */
export const TEMPLAR_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "templar",
      markets: [
        {
          marketId: "ixlm-ixlmusdc.v1.tmplr.near",
          name: "XLM/USDC",
          collateral: { symbol: "XLM", tokenId: "nep245:v2_1.omni.hot.tg:1100_111bzQBB5v7" },
          borrow: { symbol: "USDC", tokenId: "nep245:v2_1.omni.hot.tg:1100_111bzQBB65G" },
          chain: "stellar",
          ltv: "70%",
          apr: "3.67%",
          supply: "59138",
          available: "34144",
          type: "lending",
        },
      ],
      count: 1,
    }),
  },
];

// --- DeFindex ------------------------------------------------

/**
 * DeFindex resolve_pool. Keyed `vaults` (not `pools`) with `vaultAddress`
 * (not `address`) and the asset nested under `assets[]`. Captured from the
 * live MCP server on :3009.
 */
export const DEFINDEX_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "defindex",
      network: "mainnet",
      vaults: [
        {
          vaultAddress: "CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3",
          name: "DeFindex-Vault-BeansUsdcVault",
          symbol: "BNSUSDC",
          totalSupply: "5038017734651",
          apy: 6.74,
          assets: [
            {
              address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
              totalRaw: "5038018433002",
              totalDisplay: "503801.8433002",
            },
          ],
          explorerUrl:
            "https://stellar.expert/explorer/public/contract/CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3",
        },
      ],
      count: 1,
    }),
  },
];

/** DeFindex vault_list_vaults - list of vaults */
export const DEFINDEX_VAULT_LIST = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "defindex",
      vaults: [
        {
          address: "CDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12345",
          name: "USDC Yield Vault",
          asset: "USDC",
          totalSupply: "1500000",
          tvl: 1500000,
          apy: 8.5,
          status: "ok",
        },
      ],
      count: 1,
    }),
  },
];

// --- SwapBridge ----------------------------------------------

/** Swap operation result from any protocol */
export const SWAP_EXECUTE_RESULT = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      operation: "swap",
      protocol: "soroswap",
      tokenIn: "XLM",
      tokenOut: "USDC",
      amountIn: "100",
      amountOut: "27.85",
      fee: "0.30%",
      gasEstimate: "0.01 XLM",
      estimatedTime: "~5 seconds",
      xdr: "AAAAAgAAAADgj63GHGEWddciCY...",
    }),
  },
];

// --- Error / edge cases ---------------------------------------

/** MCP error response - no pools found */
export const EMPTY_MCP_RESULT = [
  {
    type: "text",
    text: JSON.stringify({ success: false, error: "No pools found" }),
  },
];

/** Malformed MCP result - invalid JSON in text field */
export const MALFORMED_MCP_RESULT = [{ type: "text", text: "not valid json{{{" }];
