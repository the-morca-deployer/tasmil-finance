export type OpKind =
  | "send"
  | "receive"
  | "swap"
  | "lp-deposit"
  | "lp-withdraw"
  | "lend-deposit"
  | "lend-withdraw"
  | "harvest"
  | "trustline-add"
  | "trustline-remove"
  | "create-account"
  | "merge-account"
  | "claim-balance"
  | "lock-balance"
  | "dex-offer"
  | "contract-other"
  | "classic-other";

export type Protocol = "soroswap" | "blend" | "aquarius" | "phoenix" | "stellar";

export interface AssetDelta {
  code: string;
  issuer?: string;
  amount: string;
  isCredit: boolean;
  contractId?: string;
}

export interface DecodedOp {
  id: string;
  txHash: string;
  pagingToken: string;
  createdAt: string;
  kind: OpKind;
  successful: boolean;
  protocol?: Protocol;
  deltas: AssetDelta[];
  counterparty?: string;
  rawType: string;
  rawFnName?: string;
}

export interface TxAttrs {
  feeChargedStroops?: string;
  memo?: string | null;
  memoType?: string | null;
  ledger?: number;
  envelopeXdr?: string;
  operationCount?: number;
}

export interface TxGroup {
  txHash: string;
  createdAt: string;
  successful: boolean;
  primary: DecodedOp;
  ops: DecodedOp[];
  attrs: TxAttrs;
}

export interface SorobanTokenMeta {
  code: string;
  decimals: number;
  contractId: string;
}

export type TokenMetaLookup = (contractId: string) => SorobanTokenMeta | undefined;
