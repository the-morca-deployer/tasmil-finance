import type { SponsorshipAction, SponsorshipProtocol } from "../types";

const PROTOCOL_LABEL: Record<SponsorshipProtocol, string> = {
  TASMIL_VAULT: "Tasmil Vault",
  BLEND: "Blend",
  SOROSWAP: "Soroswap",
  AQUARIUS: "Aquarius",
  PHOENIX: "Phoenix",
  DEFINDEX: "DeFindex",
};

export function composeTxLabel(
  action: SponsorshipAction,
  protocol: SponsorshipProtocol,
  asset: string | null,
  poolLabel: string | null
): string {
  const p = PROTOCOL_LABEL[protocol];
  if (poolLabel) {
    if (action === "DEPOSIT") return `Deposit to ${poolLabel}`;
    if (action === "WITHDRAW") return `Withdraw from ${poolLabel}`;
  }
  if (action === "DEPOSIT" && asset) return `Deposit ${asset} to ${p}`;
  if (action === "WITHDRAW" && asset) return `Withdraw ${asset} from ${p}`;
  if (action === "REBALANCE") return `Rebalance ${p} position`;
  if (action === "HARVEST") return `Harvest ${p} rewards`;
  return `${action} on ${p}`;
}
