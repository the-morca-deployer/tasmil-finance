import { z } from "zod";

// ─── Suggestion ────────────────────────────────────────────────

export const suggestionSchema = z.object({
  label: z.string().min(1),
  value: z.record(z.unknown()),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// ─── PlanStep ──────────────────────────────────────────────────

export const planStepSchema = z.object({
  index: z.number().int().nonnegative(),
  typed_intent: z.string().min(1),
  protocol: z.string().min(1),
  action: z.string().min(1),
  asset: z.string().min(1),
  amount: z.string().min(1),
  pool_address: z.string().min(1),
  description: z.string(),
  expected_apy_bps: z.number().int().optional(),
});

// ─── Plan ──────────────────────────────────────────────────────

export const planSchema = z.object({
  id: z.string().min(1),
  steps: z.array(planStepSchema).min(1),
  total_gas_xlm: z.number().nonnegative(),
  weighted_apy_bps: z.number().int(),
  idle_amount: z.number().nonnegative().optional(),
});

// ─── StepSimulation ────────────────────────────────────────────

export const stepSimulationSchema = z.object({
  step_index: z.number().int().nonnegative(),
  status: z.enum(["success", "fail"]),
  gas_consumed: z.number().nonnegative(),
  actual_return: z.string().optional(),
  error: z.string().optional(),
});

// ─── SimulationReport ──────────────────────────────────────────

export const simulationReportSchema = z.object({
  status: z.enum(["success", "partial_fail", "fail"]),
  steps: z.array(stepSimulationSchema),
  total_gas_xlm: z.number().nonnegative(),
  xdrs: z.array(z.string().min(1)).min(1),
  warnings: z.array(z.string()),
  simulated_at_ledger: z.number().int().positive(),
});

// ─── FlowPosition ──────────────────────────────────────────────

export const flowPositionSchema = z.object({
  deposit: z.string(),
  venue: z.string(),
  protocol: z.string(),
  apy_bps: z.number().int(),
  tx_hash: z.string(),
});

// ─── AssistantFlowMessage (discriminated union) ────────────────

const textMessageSchema = z.object({
  kind: z.literal("text"),
  text: z.string(),
});

const clarifyMessageSchema = z.object({
  kind: z.literal("clarify"),
  question: z.string().min(1),
  suggestions: z.array(suggestionSchema).optional(),
});

const planPreviewMessageSchema = z.object({
  kind: z.literal("plan_preview"),
  plan: planSchema,
  simulation_report: simulationReportSchema,
});

const executionUpdateMessageSchema = z.object({
  kind: z.literal("execution_update"),
  tx_hash: z.string().optional(),
  step: z.number().int().positive(),
  total_steps: z.number().int().positive(),
  status: z.enum(["submitting", "confirmed", "failed"]),
});

const positionUpdateMessageSchema = z.object({
  kind: z.literal("position_update"),
  positions: z.array(flowPositionSchema),
});

const errorMessageSchema = z.object({
  kind: z.literal("error"),
  code: z.string(),
  message: z.string(),
  retry_possible: z.boolean(),
});

const canonicalUintSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);
const canonicalIntSchema = z.string().regex(/^(?:0|-?[1-9]\d*)$/);
const txHashSchema = z.string().regex(/^[0-9a-f]{64}$/i);

const netEdgeArithmeticSchema = z
  .object({
    kind: z.literal("NET_EDGE"),
    unit: z.literal("USD_MICRO"),
    notionalUsdMicros: canonicalUintSchema,
    deltaApyBps: canonicalIntSchema,
    horizonDays: canonicalUintSchema,
    gasFeeUsdMicros: canonicalUintSchema,
    slippageUsdMicros: canonicalUintSchema,
    priceImpactUsdMicros: canonicalUintSchema,
    lockupCostUsdMicros: canonicalUintSchema,
    execFeeUsdMicros: canonicalUintSchema,
    expectedGrossGainUsdMicros: canonicalUintSchema,
    costTotalUsdMicros: canonicalUintSchema,
    uncertaintyHaircutUsdMicros: canonicalUintSchema,
    netEdgeUsdMicros: canonicalIntSchema,
  })
  .strict();

const priceIntegrityArithmeticSchema = z
  .object({
    kind: z.literal("PRICE_INTEGRITY"),
    asset: z.string().min(1),
    freshSources: canonicalUintSchema,
    requiredSources: canonicalUintSchema,
    maxDeviationBps: canonicalUintSchema.nullable().optional().default(null),
    allowedDeviationBps: canonicalUintSchema,
  })
  .strict();

const policyCheckArithmeticSchema = z
  .object({
    kind: z.literal("POLICY_CHECK"),
    check: z.enum(["SPEND_CEILING", "KILL_SWITCH", "VENUE_ALLOWLIST", "SESSION_KEY"]),
    unit: z.enum(["TOKEN_BASE", "BOOLEAN", "CONTRACT"]),
    actual: canonicalUintSchema.nullable().optional().default(null),
    limit: canonicalUintSchema.nullable().optional().default(null),
  })
  .strict();

const wasmPinArithmeticSchema = z
  .object({
    kind: z.literal("WASM_PIN"),
    contractId: z.string().min(1),
    expectedWasmHash: txHashSchema,
    observedWasmHash: txHashSchema.nullable().optional().default(null),
  })
  .strict();

const executionArithmeticSchema = z
  .object({
    kind: z.literal("EXECUTION"),
    submissionAttempt: canonicalUintSchema,
    sourceSequence: canonicalUintSchema,
    validUntilLedger: canonicalUintSchema,
    confirmedLedger: canonicalUintSchema.nullable().optional().default(null),
  })
  .strict();

export const policyDecisionArithmeticSchema = z.discriminatedUnion("kind", [
  netEdgeArithmeticSchema,
  priceIntegrityArithmeticSchema,
  policyCheckArithmeticSchema,
  wasmPinArithmeticSchema,
  executionArithmeticSchema,
]);

const policyObservationSchema = z
  .object({
    sourceId: z.string().min(1),
    sourceKind: z.enum(["REFLECTOR", "COINGECKO", "DEX", "POLICY", "WASM", "STELLAR_RPC"]),
    status: z.enum(["FRESH", "STALE", "UNAVAILABLE", "INVALID", "DUPLICATE", "CONFIRMED"]),
    network: z.enum(["mainnet", "testnet"]),
    upstreamId: z.string().min(1),
    rawValue: canonicalIntSchema.nullable().optional().default(null),
    decimals: z.number().int().min(0).max(38).nullable().optional().default(null),
    publishedAtMs: canonicalUintSchema.nullable().optional().default(null),
    observedAtMs: canonicalUintSchema,
    ledger: canonicalUintSchema.nullable().optional().default(null),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.rawValue === null) !== (value.decimals === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rawValue and decimals must be present together",
      });
    }
  });

export const policyDecisionSchema = z
  .object({
    decision: z.enum(["DECLINE", "REFUSE", "EXECUTE"]),
    status: z.enum(["DECLINED", "REFUSED", "APPROVED", "UNKNOWN", "CONFIRMED"]),
    rule: z.enum(["NET_EDGE", "PRICE_INTEGRITY", "POLICY", "WASM_PIN", "EXECUTION"]),
    arithmetic: policyDecisionArithmeticSchema,
    observations: z.array(policyObservationSchema).min(1),
    plainLanguage: z.string().min(1),
    decisionId: z.string().min(1),
    txHash: txHashSchema.nullable().optional().default(null),
  })
  .strict()
  .superRefine((value, context) => {
    const expectedDecision = {
      DECLINED: "DECLINE",
      REFUSED: "REFUSE",
      APPROVED: "EXECUTE",
      UNKNOWN: "EXECUTE",
      CONFIRMED: "EXECUTE",
    } as const;
    const expectedArithmetic = {
      NET_EDGE: "NET_EDGE",
      PRICE_INTEGRITY: "PRICE_INTEGRITY",
      POLICY: "POLICY_CHECK",
      WASM_PIN: "WASM_PIN",
      EXECUTION: "EXECUTION",
    } as const;
    if (value.decision !== expectedDecision[value.status]) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "status and decision disagree" });
    }
    if (value.arithmetic.kind !== expectedArithmetic[value.rule]) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "rule and arithmetic disagree" });
    }
    if (
      value.arithmetic.kind === "POLICY_CHECK" &&
      value.arithmetic.check === "SPEND_CEILING" &&
      (value.arithmetic.actual === null || value.arithmetic.limit === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SPEND_CEILING requires exact actual and limit values",
      });
    }
    const chainStatus = value.status === "UNKNOWN" || value.status === "CONFIRMED";
    if (chainStatus !== (value.txHash !== null) || (chainStatus && value.rule !== "EXECUTION")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "invalid transaction/status evidence",
      });
    }
    const networks = new Set(value.observations.map((observation) => observation.network));
    if (networks.size !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "mixed Stellar networks" });
    }
    if (value.arithmetic.kind === "EXECUTION") {
      const confirmed = value.arithmetic.confirmedLedger !== null;
      if ((value.status === "CONFIRMED") !== confirmed) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "invalid confirmed ledger" });
      }
    }
  });

const policyActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("view_replay"), decisionId: z.string().min(1) }).strict(),
  z
    .object({
      kind: z.literal("refresh_status"),
      decisionId: z.string().min(1),
      txHash: txHashSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("view_transaction"),
      decisionId: z.string().min(1),
      txHash: txHashSchema,
    })
    .strict(),
]);

export const policyDecisionMessageSchema = z
  .object({
    kind: z.literal("policy_decision"),
    policyDecision: policyDecisionSchema,
    message: z.string().min(1),
    actions: z.array(policyActionSchema),
  })
  .strict()
  .superRefine((value, context) => {
    const { decisionId, status, txHash } = value.policyDecision;
    if (value.actions.some((action) => action.decisionId !== decisionId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "action decisionId mismatch" });
    }
    const kinds = value.actions
      .map((action) => action.kind)
      .sort()
      .join(",");
    const expected =
      status === "UNKNOWN"
        ? "refresh_status,view_replay"
        : status === "CONFIRMED"
          ? "view_replay,view_transaction"
          : "view_replay";
    if (kinds !== expected) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "actions disagree with status" });
    }
    for (const action of value.actions) {
      if ("txHash" in action && action.txHash !== txHash) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "action txHash mismatch" });
      }
    }
  });

export const assistantFlowMessageSchema = z.union([
  textMessageSchema,
  clarifyMessageSchema,
  planPreviewMessageSchema,
  executionUpdateMessageSchema,
  positionUpdateMessageSchema,
  errorMessageSchema,
  policyDecisionMessageSchema,
]);
