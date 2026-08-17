import { DEFINDEX_RESOLVE_POOL, DEFINDEX_VAULT_LIST } from "../../__fixtures__/mcp-tool-outputs";
import { normalizeDefindexVaultsFromMcp } from "../defindex-from-mcp";
import { normalizeVaultsFromSdk } from "../defindex-from-sdk";

describe("normalizeDefindexVaultsFromMcp", () => {
  it("reads the `vaults` key that resolve_pool actually returns", () => {
    const vaults = normalizeDefindexVaultsFromMcp(DEFINDEX_RESOLVE_POOL);
    expect(vaults).toHaveLength(1);
  });

  it("maps vaultAddress onto address so the card can render it", () => {
    const vault = normalizeDefindexVaultsFromMcp(DEFINDEX_RESOLVE_POOL)[0]!;
    expect(vault.address).toBe("CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3");
    expect(vault.address).toHaveLength(56);
  });

  it("lifts the underlying asset out of the nested assets array", () => {
    const vault = normalizeDefindexVaultsFromMcp(DEFINDEX_RESOLVE_POOL)[0]!;
    expect(vault.asset).toBe("USDC");
    expect(vault.assetAddress).toBe("CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75");
    expect(vault.apy).toBe(6.74);
  });

  it("leaves status undefined rather than claiming a live vault is unavailable", () => {
    const vault = normalizeDefindexVaultsFromMcp(DEFINDEX_RESOLVE_POOL)[0]!;
    expect(vault.status).toBeUndefined();
  });

  it("still honours an explicit status when the payload carries one", () => {
    const vault = normalizeDefindexVaultsFromMcp(DEFINDEX_VAULT_LIST)[0]!;
    expect(vault.status).toBe("ok");
  });
});

describe("normalizeVaultsFromSdk", () => {
  it("still reads the REST route's `pools` key", () => {
    const vaults = normalizeVaultsFromSdk({
      pools: [
        {
          address: "CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3",
          name: "Beans USDC",
          asset: "USDC",
          apy: 6.74,
          status: "ok",
        },
      ],
    });
    expect(vaults).toHaveLength(1);
    expect(vaults[0]!.name).toBe("Beans USDC");
    expect(vaults[0]!.status).toBe("ok");
  });
});
