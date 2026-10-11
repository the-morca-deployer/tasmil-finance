/** @jest-environment node */

import { getBlendV2Pools } from "@tasmil-finance/adapter-sdk";
import { getClient } from "../../protocols/_sdk";
import { GET } from "./route";

const ETHERFUSE = "CDMAVJPFXPADND3YRL4BSM3AKZWCTFMX27GLLXCML3PD62HEQS5FPVAI";
const ADDRESS = "GDQMYMPSBBF53QOXRAL3UIHERQNGPWII77WJCHZE6OM7LNL2MHZGVVI6";

jest.mock("@tasmil-finance/adapter-sdk", () => ({
  getBlendV2Pools: jest.fn(() => [
    { name: "Etherfuse Pool", address: "CDMAVJPFXPADND3YRL4BSM3AKZWCTFMX27GLLXCML3PD62HEQS5FPVAI" },
  ]),
}));
jest.mock("../../protocols/_sdk", () => ({ getClient: jest.fn(), getNetwork: () => "mainnet" }));

it("shows Etherfuse collateral when reward-zone discovery is empty", async () => {
  const getUserPositions = jest.fn().mockResolvedValue({
    poolName: "Etherfuse Pool",
    collateral: [{ symbol: "XLM", amount: 50, apy: 0 }],
    supply: [],
    liabilities: [],
    emissions: null,
  });
  (getClient as jest.Mock).mockReturnValue({
    blend: {
      listPools: jest.fn().mockResolvedValue([]),
      getUserPositions,
    },
  });

  const request = {
    nextUrl: new URL(`https://example.com/api/positions/blend?user=${ADDRESS}`),
  } as any;
  const response = await GET(request);
  const body = await response.json();

  expect(getUserPositions).toHaveBeenCalledWith(ETHERFUSE, ADDRESS);
  expect(body.groups).toEqual([
    expect.objectContaining({
      displayName: "Blend · Etherfuse Pool",
      positions: [expect.objectContaining({ asset: "XLM", extra: "50 XLM" })],
    }),
  ]);
});

it("returns an error when the Etherfuse position read keeps failing", async () => {
  (getClient as jest.Mock).mockReturnValue({
    blend: {
      listPools: jest.fn().mockResolvedValue([]),
      getUserPositions: jest.fn().mockRejectedValue(new Error("RPC 429")),
    },
  });

  const request = {
    nextUrl: new URL(`https://example.com/api/positions/blend?user=${ADDRESS}`),
  } as any;
  const response = await GET(request);
  const body = await response.json();

  expect(response.status).toBe(500);
  expect(body.success).toBe(false);
  expect(body.error).toContain("scan incomplete");
});

it("keeps a readable position and reports another pool that failed", async () => {
  const otherPool = "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD";
  (getBlendV2Pools as jest.Mock).mockReturnValue([
    { name: "Etherfuse Pool", address: ETHERFUSE },
    { name: "Fixed Pool", address: otherPool },
  ]);
  (getClient as jest.Mock).mockReturnValue({
    blend: {
      listPools: jest.fn().mockResolvedValue([]),
      getUserPositions: jest.fn().mockImplementation(async (pool: string) => {
        if (pool === otherPool) throw new Error("RPC 429");
        return {
          poolAddress: ETHERFUSE,
          poolName: "Etherfuse Pool",
          collateral: [{ symbol: "XLM", amount: 50, apy: 0 }],
          supply: [],
          liabilities: [],
          emissions: null,
        };
      }),
    },
  });

  const request = {
    nextUrl: new URL(`https://example.com/api/positions/blend?user=${ADDRESS}`),
  } as any;
  const response = await GET(request);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.groups).toHaveLength(1);
  expect(body.incompletePools).toEqual([otherPool]);
});
