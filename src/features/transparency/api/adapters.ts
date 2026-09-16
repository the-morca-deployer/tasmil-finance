import { z } from "zod";

const networkSchema = z.enum(["testnet", "mainnet"]);
const decimalStringSchema = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/, "expected an exact decimal string");
const unsignedIntegerStringSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, "expected an unsigned integer string");
const ledgerSchema = z
  .union([unsignedIntegerStringSchema, z.number().int().nonnegative().safe()])
  .transform(String);
const nullableLedgerSchema = ledgerSchema.nullable();
const txHashSchema = z.string().regex(/^[0-9a-f]{64}$/i, "expected a Stellar transaction hash");

type Network = z.infer<typeof networkSchema>;

function explorerNetwork(network: Network): "public" | "testnet" {
  return network === "mainnet" ? "public" : "testnet";
}

function txExplorer(network: Network, txHash: string): string {
  return `https://stellar.expert/explorer/${explorerNetwork(network)}/tx/${txHash}`;
}

const feeEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["perf_fee", "exec_fee", "settle"]),
  network: networkSchema,
  sourceContract: z.string().min(1),
  ledger: ledgerSchema,
  ledgerClosedAt: z.string().datetime({ offset: true }),
  wallet: z.string().nullable(),
  strategy: z.string().nullable(),
  amount: decimalStringSchema.nullable(),
  details: z.unknown(),
  txHash: txHashSchema,
  txStatus: z.literal("CONFIRMED"),
  explorerUrl: z.string().url(),
});

const feePageSchema = z
  .object({
    network: networkSchema,
    sourceContract: z.string().min(1),
    readRange: z.object({
      requestedStartLedger: nullableLedgerSchema,
      effectiveStartLedger: nullableLedgerSchema,
      oldestLedger: ledgerSchema,
      latestLedger: ledgerSchema,
      partial: z.boolean(),
    }),
    events: z.array(feeEventSchema),
    nextCursor: z.string().min(1).nullable(),
  })
  .superRefine((page, context) => {
    for (const [index, event] of page.events.entries()) {
      if (event.network !== page.network) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index, "network"],
          message: "fee event network disagrees with page network",
        });
      }
      if (event.sourceContract !== page.sourceContract) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index, "sourceContract"],
          message: "fee event contract disagrees with page contract",
        });
      }
      if (event.explorerUrl !== txExplorer(event.network, event.txHash)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index, "explorerUrl"],
          message: "fee explorer URL disagrees with its Stellar network or transaction",
        });
      }
    }
  });

const activityItemSchema = z
  .object({
    id: z.string().min(1),
    accountId: z.string().min(1),
    streamId: z.string().min(1),
    seq: unsignedIntegerStringSchema,
    entryType: z.string().min(1),
    decisionId: z.string().min(1).nullable(),
    payload: z.unknown(),
    network: networkSchema,
    latestLedger: nullableLedgerSchema,
    txHash: txHashSchema.nullable().optional().default(null),
    txStatus: z.string().min(1).nullable().optional().default(null),
    explorerUrl: z.string().url().nullable().optional().default(null),
    createdAt: z.string().datetime({ offset: true }),
  })
  .superRefine((item, context) => {
    const expected = item.txHash ? txExplorer(item.network, item.txHash) : null;
    if (item.explorerUrl !== expected) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["explorerUrl"],
        message: "activity explorer URL disagrees with its Stellar network or transaction",
      });
    }
  });

const activityPageSchema = z.object({
  items: z.array(activityItemSchema),
  nextCursor: z.string().min(1).nullable(),
});

const replaySchema = z
  .object({
    decisionId: z.string().min(1),
    accountId: z.string().min(1),
    network: networkSchema,
    stages: z.array(z.unknown()),
    chainValid: z.boolean(),
    entriesVerified: z.number().int().nonnegative(),
    recomputedRoot: z.string().regex(/^[0-9a-f]{64}$/i),
    anchorTx: txHashSchema.nullable().optional().default(null),
    finalTx: txHashSchema.nullable().optional().default(null),
    finalTxStatus: z.string().min(1).nullable().optional().default(null),
    finalTxExplorer: z.string().url().nullable().optional().default(null),
  })
  .superRefine((replay, context) => {
    const expected = replay.finalTx ? txExplorer(replay.network, replay.finalTx) : null;
    if (replay.finalTxExplorer !== expected) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalTxExplorer"],
        message: "replay explorer URL disagrees with its Stellar network or transaction",
      });
    }
  });

const ruleSchema = z.object({
  contract: z.string().min(1),
  selector: z.string().min(1),
  allowed: z.boolean(),
  amount: z.object({
    argIndex: unsignedIntegerStringSchema,
    argType: z.string().min(1),
    semantics: z.string().min(1),
    asset: z.string().min(1),
    flow: z.string().min(1),
  }),
  perTx: z.object({ limit: unsignedIntegerStringSchema, denom: z.string().min(1) }),
});

const rulebookSessionSchema = z.object({
  pubkey: z.string().min(1),
  revoked: z.boolean(),
  expiresAtLedger: ledgerSchema,
  allowedContracts: z.array(z.string().min(1)),
  maxCallsPerDay: unsignedIntegerStringSchema,
  coolDownLedgers: unsignedIntegerStringSchema,
  scopeVersion: unsignedIntegerStringSchema,
  cumulative: z.object({
    limit: unsignedIntegerStringSchema,
    denom: z.string().min(1),
    windowLedgers: unsignedIntegerStringSchema,
    spent: unsignedIntegerStringSchema,
    windowStartLedger: ledgerSchema,
  }),
  position: z.object({
    maxExposureBps: unsignedIntegerStringSchema,
    maxPositionUsdE7: unsignedIntegerStringSchema,
  }),
  dailyCalls: z.object({
    used: unsignedIntegerStringSchema,
    resetLedger: nullableLedgerSchema,
    lastCallLedger: ledgerSchema,
  }),
  rules: z.array(ruleSchema),
});

const rulebookSchema = z
  .object({
    accountId: z.string().min(1),
    network: networkSchema,
    contract: z.string().min(1),
    readAtLedger: ledgerSchema,
    instanceLiveUntilLedger: nullableLedgerSchema,
    killSwitch: z.boolean(),
    killSwitchSource: z.enum(["STORED", "CONTRACT_DEFAULT"]),
    executionRouter: z.string().min(1).nullable(),
    interfaceRegistry: z.string().min(1).nullable(),
    globalDailyCalls: z.object({
      used: unsignedIntegerStringSchema,
      resetLedger: nullableLedgerSchema,
      max: unsignedIntegerStringSchema,
    }),
    sessions: z.array(rulebookSessionSchema),
    explorerUrl: z.string().url(),
  })
  .superRefine((rulebook, context) => {
    const expected = `https://stellar.expert/explorer/${explorerNetwork(rulebook.network)}/contract/${rulebook.contract}`;
    if (rulebook.explorerUrl !== expected) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["explorerUrl"],
        message: "rulebook explorer URL disagrees with its Stellar network or contract",
      });
    }
  });

export type FeePage = z.infer<typeof feePageSchema>;
export type ActivityPage = z.infer<typeof activityPageSchema>;
export type DecisionReplay = z.infer<typeof replaySchema>;
export type Rulebook = z.infer<typeof rulebookSchema>;

export function adaptFeePage(value: unknown): FeePage {
  return feePageSchema.parse(value);
}

export function adaptActivityPage(value: unknown): ActivityPage {
  return activityPageSchema.parse(value);
}

export function adaptReplay(value: unknown): DecisionReplay {
  return replaySchema.parse(value);
}

export function adaptRulebook(value: unknown): Rulebook {
  return rulebookSchema.parse(value);
}
