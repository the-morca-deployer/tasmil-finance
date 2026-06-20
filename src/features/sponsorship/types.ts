export type SponsorshipAction = "DEPOSIT" | "WITHDRAW" | "REBALANCE" | "HARVEST";

export type SponsorshipProtocol =
  | "TASMIL_VAULT"
  | "BLEND"
  | "SOROSWAP"
  | "AQUARIUS"
  | "PHOENIX"
  | "DEFINDEX";

export type SponsorshipDetailState = "loading" | "guest" | "fresh" | "active" | "exhausted";

export interface RecentTx {
  txHash: string;
  action: SponsorshipAction;
  protocol: SponsorshipProtocol;
  asset: string | null;
  poolLabel: string | null;
  feeStroops: string;
  createdAt: string;
}

export interface SponsorshipMe {
  enrolled: boolean;
  rank: number | null;
  cohortSize: number;
  modalSeen: boolean;
  config: {
    maxTxPerUser: number;
    maxXlmPerTx: string;
    totalCapXlm: string;
    network: "mainnet" | "testnet";
  };
  usage: {
    txCount: number;
    txRemaining: number;
    xlmSponsoredStroops: string;
    xlmRemainingStroops: string;
    lastSponsoredAt: string | null;
  } | null;
  recentTxs: RecentTx[];
}

export interface TxSubmitResult {
  txHash: string;
  sponsored: boolean;
  feeStroops: string;
  sponsoredFeeStroops: string;
  fallbackReason?: string;
}
