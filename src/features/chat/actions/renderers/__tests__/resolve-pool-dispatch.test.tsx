/**
 * resolve_pool is a single tool whose payload shape differs per protocol.
 * These tests pin the dispatch: each protocol must reach the card that fits
 * its payload, and must never be rendered under another protocol's name.
 */

// PoolInfoCard is the deliberate fallback for protocols with no card of their
// own. Stub it so the test asserts on dispatch rather than on its internals.
jest.mock("@/features/chat/actions/components/stellar/pool-info-card", () => ({
  PoolInfoCard: () => <div data-testid="card-pool-info" />,
}));

// The protocol card barrels re-export tx cards, which transitively load the
// Stellar SDK (native crypto, unavailable in jsdom) and the LangGraph stream
// client. The pool cards under test use neither, so stub the two leaf modules
// rather than the cards themselves - that keeps every card real.
jest.mock("@/lib/stellar-network-check", () => ({
  APP_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  APP_NETWORK_NAME: "Testnet",
  checkWalletNetwork: jest.fn(async () => {}),
  NetworkMismatchError: class extends Error {},
  parseSigningError: (e: unknown) => String(e),
}));
jest.mock("@/features/chat/hooks/use-stream", () => ({
  useStreamContext: () => ({ messages: [], submit: async () => {} }),
}));

import { render, screen } from "@testing-library/react";
import React from "react";
import {
  AQUARIUS_RESOLVE_POOL,
  BLEND_RESOLVE_POOL_WITH_REGISTRY,
  DEFINDEX_RESOLVE_POOL,
  PHOENIX_RESOLVE_POOL,
  SOROSWAP_RESOLVE_POOL,
  TEMPLAR_RESOLVE_POOL,
} from "@/features/protocols/__fixtures__/mcp-tool-outputs";
import { BLEND_RENDERER_ENTRIES } from "../blend-renderers";

const resolvePoolEntry = BLEND_RENDERER_ENTRIES.find((e) => e.toolName === "resolve_pool");

function renderResolvePool(protocol: string | undefined, result: unknown) {
  if (!resolvePoolEntry) throw new Error("resolve_pool renderer is not registered");
  const element = resolvePoolEntry.entry.render({
    status: "complete",
    args: protocol ? { protocol } : {},
    result,
  } as Parameters<typeof resolvePoolEntry.entry.render>[0]);
  return render(element as React.ReactElement);
}

describe("resolve_pool dispatch by protocol", () => {
  it("routes aquarius to the Aquarius pools card", () => {
    renderResolvePool("aquarius", AQUARIUS_RESOLVE_POOL);
    expect(screen.getByTestId("card-aqua-pools")).toBeInTheDocument();
  });

  it("routes soroswap to the Soroswap pools card", () => {
    renderResolvePool("soroswap", SOROSWAP_RESOLVE_POOL);
    expect(screen.getByTestId("card-soroswap-pools")).toBeInTheDocument();
  });

  it("routes blend to the Blend pools card", () => {
    renderResolvePool("blend", BLEND_RESOLVE_POOL_WITH_REGISTRY);
    expect(screen.getByTestId("card-blend-pools")).toBeInTheDocument();
  });

  it("routes a missing protocol arg to the Blend pools card, as the tool itself defaults", () => {
    renderResolvePool(undefined, BLEND_RESOLVE_POOL_WITH_REGISTRY);
    expect(screen.getByTestId("card-blend-pools")).toBeInTheDocument();
  });

  it("routes phoenix to the Phoenix pools card, not the Blend one", () => {
    renderResolvePool("phoenix", PHOENIX_RESOLVE_POOL);
    expect(screen.getByTestId("card-phoenix-pools")).toBeInTheDocument();
    expect(screen.queryByTestId("card-blend-pools")).not.toBeInTheDocument();
  });

  it("routes defindex to the DeFindex vaults card instead of rendering nothing", () => {
    renderResolvePool("defindex", DEFINDEX_RESOLVE_POOL);
    expect(screen.getByTestId("card-defindex-vaults")).toBeInTheDocument();
    expect(screen.queryByTestId("card-pool-info")).not.toBeInTheDocument();
  });

  it("falls back to the generic pool card for templar, which has no card of its own", () => {
    renderResolvePool("templar", TEMPLAR_RESOLVE_POOL);
    expect(screen.getByTestId("card-pool-info")).toBeInTheDocument();
  });

  it("falls back to the generic pool card for a protocol with no entry", () => {
    renderResolvePool("sdex", { success: true, protocol: "sdex" });
    expect(screen.getByTestId("card-pool-info")).toBeInTheDocument();
  });
});

describe("resolve_pool renders the fields each payload carries", () => {
  it("shows the Phoenix stake contract, which the Blend path dropped", () => {
    renderResolvePool("phoenix", PHOENIX_RESOLVE_POOL);
    const stake = screen.getByText("CAF3UJ45ZQJP6USFUIMVMGOUETUTXEC35R2247VJYIVQBGKTKBZKNBJ3");
    expect(stake.textContent).toHaveLength(56);
  });

  it("shows no fabricated 'unknown' status for a Phoenix result", () => {
    renderResolvePool("phoenix", PHOENIX_RESOLVE_POOL);
    expect(screen.queryByText("unknown")).not.toBeInTheDocument();
    expect(screen.queryByText(/Blend/)).not.toBeInTheDocument();
  });

  it("shows blend's backstop, BLND token and Comet LP contracts", () => {
    renderResolvePool("blend", BLEND_RESOLVE_POOL_WITH_REGISTRY);
    for (const address of [
      "CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7",
      "CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY",
      "CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM",
    ]) {
      const node = screen.getByText(address);
      expect(node).toBeInTheDocument();
      expect(node.textContent).toHaveLength(56);
    }
  });

  it("shows the DeFindex vault contract and does not mark a live vault Unavailable", () => {
    renderResolvePool("defindex", DEFINDEX_RESOLVE_POOL);
    const node = screen.getByText("CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3");
    expect(node.textContent).toHaveLength(56);
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
  });
});
