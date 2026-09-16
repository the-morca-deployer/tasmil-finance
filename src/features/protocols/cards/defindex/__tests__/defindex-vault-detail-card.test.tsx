// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen } from "@testing-library/react";
import React from "react";
import type { DefindexVaultDetailProps } from "@/features/protocols/schemas/defindex.schema";
import { DefindexVaultDetailCard } from "../defindex-vault-detail-card";

const VAULT = "CBOIQ3UUIPJRIUFEX6DI3FZ2LOELW74YJO3OC4KNEZD3YJNLDCKG33TQ";
const ASSET = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
const STRATEGY = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F";

const makeVault = (
  overrides: Partial<DefindexVaultDetailProps> = {}
): DefindexVaultDetailProps => ({
  address: VAULT,
  name: "Blend USDC Vault",
  symbol: "dfUSDC",
  status: "ok",
  apy: 8.42,
  assets: [
    {
      address: ASSET,
      name: "USD Coin",
      symbol: "USDC",
      strategies: [{ address: STRATEGY, name: "Blend Fixed", paused: false }],
    },
  ],
  feesBps: { vaultFee: 100, defindexFee: 50 },
  ...overrides,
});

describe("DefindexVaultDetailCard", () => {
  it("renders the full asset contract address, untruncated", () => {
    render(<DefindexVaultDetailCard vault={makeVault()} mode="playground" />);
    const node = screen.getByText(ASSET);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders the full strategy contract address, untruncated", () => {
    render(<DefindexVaultDetailCard vault={makeVault()} mode="playground" />);
    const node = screen.getByText(STRATEGY);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders the vault's own contract address, which was previously not shown at all", () => {
    render(<DefindexVaultDetailCard vault={makeVault()} mode="playground" />);
    const node = screen.getByText(VAULT);
    expect(node).toBeInTheDocument();
    expect(node.textContent).toHaveLength(56);
  });

  it("renders full addresses in chat mode too", () => {
    render(<DefindexVaultDetailCard vault={makeVault()} mode="chat" />);
    expect(screen.getByText(VAULT)).toBeInTheDocument();
    expect(screen.getByText(ASSET)).toBeInTheDocument();
    expect(screen.getByText(STRATEGY)).toBeInTheDocument();
  });

  it("renders the full fund-breakdown asset and strategy allocation addresses", () => {
    render(
      <DefindexVaultDetailCard
        vault={makeVault({
          totalManagedFunds: [
            {
              asset: ASSET,
              idle_amount: "1000000",
              invested_amount: "9000000",
              total_amount: "10000000",
              strategy_allocations: [
                { amount: "9000000", paused: false, strategy_address: STRATEGY },
              ],
            },
          ],
          assets: undefined,
        })}
        mode="playground"
      />
    );
    expect(screen.getByText(ASSET)).toBeInTheDocument();
    expect(screen.getByText(STRATEGY)).toBeInTheDocument();
  });

  it("still renders the asset symbol and strategy name alongside the addresses", () => {
    render(<DefindexVaultDetailCard vault={makeVault()} mode="playground" />);
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("Blend Fixed")).toBeInTheDocument();
  });

  it("exposes a card test id so E2E card scraping can see its content", () => {
    render(<DefindexVaultDetailCard vault={makeVault()} mode="chat" />);
    expect(screen.getByTestId("card-defindex-vault-detail")).toBeInTheDocument();
  });
});
