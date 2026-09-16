#!/usr/bin/env tsx
/**
 * Generate 5 chat scenarios per MCP tool (~330 total for 66 tools).
 *
 * Run: pnpm tsx tasmil-finance/loop-config/scenarios/generate-tool-scenarios.ts
 * Output: tasmil-finance/loop-config/scenarios/chat-by-tool.yaml
 *
 * Scenarios per tool (5 categories):
 *   1. happy_path       - natural prompt that should call this tool
 *   2. slot_filling     - ambiguous prompt; AI should ask clarify, NOT call tool
 *   3. invalid_input    - fake/malformed args; AI must reject gracefully
 *   4. hallucination    - ask for tool's contract address; AI must not make up
 *   5. variant_phrasing - same intent as happy_path, different wording
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TSV_PATH = "/tmp/mcp-tools.tsv";
const OUT_PATH = join(__dirname, "chat-by-tool.yaml");

interface ToolDef {
  category: string;
  name: string;
  desc: string;
}

const tsvRaw = readFileSync(TSV_PATH, "utf-8");
const tools: ToolDef[] = tsvRaw
  .split("\n")
  .slice(1)
  .filter((l) => l.trim())
  .map((l) => {
    const [category, name, desc] = l.split("\t");
    return { category: category ?? "", name: name ?? "", desc: desc ?? "" };
  })
  .filter((t) => t.name);

console.log(`Loaded ${tools.length} tools`);

type Intent =
  | "deposit"
  | "withdraw"
  | "swap"
  | "borrow"
  | "repay"
  | "claim"
  | "stake"
  | "unstake"
  | "lock"
  | "query"
  | "discover"
  | "execute"
  | "info"
  | "other";

function classifyIntent(name: string): Intent {
  const n = name.toLowerCase();
  if (
    n.includes("deposit") ||
    n.includes("supply") ||
    n.includes("provide_liquidity") ||
    n.includes("add_liquidity") ||
    n.includes("join_comet") ||
    n.includes("backstop_deposit")
  )
    return "deposit";
  if (n.includes("withdraw") || n.includes("exit") || n.includes("backstop_withdraw"))
    return "withdraw";
  if (n.includes("swap")) return "swap";
  if (n.includes("borrow")) return "borrow";
  if (n.includes("repay")) return "repay";
  if (n.includes("claim")) return "claim";
  if (
    n.includes("stake_bond") ||
    (n.includes("stake") && !n.includes("unstake") && !n.includes("unbond"))
  )
    return "stake";
  if (n.includes("unstake") || n.includes("unbond")) return "unstake";
  if (n.includes("lock")) return "lock";
  if (n.includes("discover")) return "discover";
  if (n.includes("execute")) return "execute";
  if (n.startsWith("get_") || n.includes("info") || n.includes("details")) return "info";
  if (
    n.includes("price") ||
    n.includes("apy") ||
    n.includes("yield") ||
    n.includes("data") ||
    n.includes("market") ||
    n.includes("token") ||
    n.includes("risk") ||
    n.includes("chain")
  )
    return "query";
  return "other";
}

function getProtocol(name: string): string {
  const parts = name.split("_");
  const known = [
    "blend",
    "soroswap",
    "aquarius",
    "phoenix",
    "allbridge",
    "sdex",
    "defindex",
    "tasmil",
  ];
  for (const p of parts) {
    if (known.includes(p)) return p;
  }
  return parts[0] ?? "unknown";
}

function escYaml(s: string): string {
  return s.replace(/"/g, '\\"');
}

function genScenarios(t: ToolDef, baseIdx: number): string[] {
  const intent = classifyIntent(t.name);
  const protocol = getProtocol(t.name);
  const layer: string[] = ["frontend", "ai", "mcp"];
  const scenarios: string[] = [];

  const render = (
    id: string,
    category: string,
    prompt: string,
    expect: Record<string, unknown>,
    layerOverride?: string[]
  ) => {
    const lines: string[] = [];
    lines.push(`- id: ${id}`);
    lines.push(`  type: curated_chat`);
    lines.push(`  layer_hint: [${(layerOverride ?? layer).join(", ")}]`);
    lines.push(`  category: ${category}`);
    lines.push(`  tool: ${t.name}`);
    lines.push(`  prompt: "${escYaml(prompt)}"`);
    lines.push(`  expect:`);
    for (const [k, v] of Object.entries(expect)) {
      if (Array.isArray(v)) {
        lines.push(`    ${k}: [${v.map((x) => `"${escYaml(String(x))}"`).join(", ")}]`);
      } else {
        lines.push(`    ${k}: ${v}`);
      }
    }
    return lines.join("\n");
  };

  // 1. HAPPY PATH
  let happyPrompt = "";
  let happyExpect: Record<string, unknown> = { must_call_tool: [t.name], max_latency_sec: 30 };
  switch (intent) {
    case "deposit":
      happyPrompt = `Deposit 100 USDC into the ${protocol} pool`;
      break;
    case "withdraw":
      happyPrompt = `Withdraw 50 USDC from my ${protocol} position`;
      break;
    case "swap":
      happyPrompt = `Swap 10 XLM to USDC on ${protocol}`;
      break;
    case "borrow":
      happyPrompt = `Borrow 50 USDC from ${protocol} against my collateral`;
      break;
    case "repay":
      happyPrompt = `Repay 25 USDC of my ${protocol} loan`;
      break;
    case "claim":
      happyPrompt = `Claim my pending rewards from ${protocol}`;
      break;
    case "stake":
      happyPrompt = `Stake my LP tokens in ${protocol}`;
      break;
    case "unstake":
      happyPrompt = `Unstake my position from ${protocol}`;
      break;
    case "lock":
      happyPrompt = `Lock 100 AQUA tokens for 1 year on Aquarius`;
      break;
    case "discover":
      happyPrompt = `Find the best USDC yield options across all protocols`;
      break;
    case "execute":
      happyPrompt = `Execute deposit of 50 USDC to the best Blend pool`;
      break;
    case "info":
      happyPrompt = `Show me my current portfolio positions`;
      happyExpect = { must_call_tool: [t.name], max_latency_sec: 20 };
      break;
    case "query":
      happyPrompt = `What is the current APY on USDC pools?`;
      happyExpect = { must_call_tool: [t.name], max_latency_sec: 20 };
      break;
    default:
      happyPrompt = `Use the ${t.name} feature with default parameters`;
  }
  scenarios.push(
    render(
      `tool-${String(baseIdx).padStart(3, "0")}-happy`,
      `${intent}_happy`,
      happyPrompt,
      happyExpect
    )
  );

  // 2. SLOT FILLING
  let slotPrompt = "";
  const slotExpect: Record<string, unknown> = {
    must_not_contain: [`"${t.name}"`],
    max_latency_sec: 20,
  };
  switch (intent) {
    case "deposit":
    case "withdraw":
    case "borrow":
    case "repay":
      slotPrompt = `${intent === "deposit" ? "Deposit" : intent === "withdraw" ? "Withdraw" : intent === "borrow" ? "Borrow" : "Repay"} into ${protocol}`;
      slotExpect.must_ask_clarification = ["amount", "asset"];
      break;
    case "swap":
      slotPrompt = `Swap some tokens on ${protocol}`;
      slotExpect.must_ask_clarification = ["amount", "from", "to"];
      break;
    case "stake":
    case "unstake":
    case "lock":
      slotPrompt = `${intent === "stake" ? "Stake" : intent === "unstake" ? "Unstake" : "Lock"} on ${protocol}`;
      slotExpect.must_ask_clarification = ["amount", "pool"];
      break;
    case "claim":
      slotPrompt = `Claim rewards`;
      slotExpect.must_ask_clarification = ["pool", "protocol"];
      break;
    case "discover":
    case "execute":
      slotPrompt = `${intent === "discover" ? "Find me something" : "Execute the thing"}`;
      slotExpect.must_ask_clarification = ["what", "which"];
      break;
    case "info":
    case "query":
      slotPrompt = `Show me info`;
      slotExpect.must_ask_clarification = ["what", "which"];
      break;
    default:
      slotPrompt = `Do the thing on ${protocol}`;
      slotExpect.must_ask_clarification = ["what"];
  }
  scenarios.push(
    render(
      `tool-${String(baseIdx).padStart(3, "0")}-slot`,
      `${intent}_slot_filling`,
      slotPrompt,
      slotExpect
    )
  );

  // 3. INVALID INPUT
  const fakeAddr = "CINVALIDFAKEINVALIDFAKEINVALIDFAKEINVALIDFAKEINVALIDFAKE12";
  let invalidPrompt = "";
  const invalidExpect: Record<string, unknown> = {
    must_not_contain: ["successful", "completed", "✅"],
    max_latency_sec: 25,
  };
  switch (intent) {
    case "deposit":
    case "withdraw":
      invalidPrompt = `${intent === "deposit" ? "Deposit" : "Withdraw"} 100 USDC into pool ${fakeAddr}`;
      invalidExpect.must_contain = ["invalid", "not found", "could not", "doesn't"];
      break;
    case "swap":
      invalidPrompt = `Swap -50 XLM to USDC on ${protocol}`;
      invalidExpect.must_contain = ["invalid", "amount", "negative", "must be"];
      break;
    case "borrow":
    case "repay":
      invalidPrompt = `${intent === "borrow" ? "Borrow" : "Repay"} 999999999 USDC from ${protocol}`;
      invalidExpect.must_contain = ["exceed", "insufficient", "too much", "available"];
      break;
    case "info":
    case "query":
      invalidPrompt = `Get ${intent} for address ${fakeAddr}`;
      invalidExpect.must_contain = ["invalid", "not found", "could not"];
      break;
    default:
      invalidPrompt = `Use ${t.name} with malformed args { foo: invalid }`;
      invalidExpect.must_contain = ["invalid", "error", "could not"];
  }
  scenarios.push(
    render(
      `tool-${String(baseIdx).padStart(3, "0")}-invalid`,
      `${intent}_invalid_input`,
      invalidPrompt,
      invalidExpect
    )
  );

  // 4. HALLUCINATION CHECK
  scenarios.push(
    render(
      `tool-${String(baseIdx).padStart(3, "0")}-hallu`,
      `${intent}_hallucination`,
      `What is the exact contract address for ${t.name.replace(/_/g, " ")}?`,
      {
        no_hallucinated_addresses: true,
        max_latency_sec: 20,
      },
      ["ai"]
    )
  );

  // 5. VARIANT PHRASING
  let variantPrompt = "";
  switch (intent) {
    case "deposit":
      variantPrompt = `I want to put 100 USDC into ${protocol}, what do I do?`;
      break;
    case "withdraw":
      variantPrompt = `Can you take 50 USDC out of my ${protocol} position?`;
      break;
    case "swap":
      variantPrompt = `Convert 10 XLM into USDC using ${protocol}`;
      break;
    case "borrow":
      variantPrompt = `I'd like to take a 50 USDC loan from ${protocol}`;
      break;
    case "repay":
      variantPrompt = `Pay back 25 USDC on my ${protocol} debt`;
      break;
    case "claim":
      variantPrompt = `My ${protocol} rewards are pending - collect them please`;
      break;
    case "stake":
      variantPrompt = `Add my tokens to ${protocol} staking`;
      break;
    case "unstake":
      variantPrompt = `Pull my staked tokens out of ${protocol}`;
      break;
    case "lock":
      variantPrompt = `Long-term lock 100 AQUA on Aquarius please`;
      break;
    case "discover":
      variantPrompt = `Where can I get the best yield on USDC right now?`;
      break;
    case "execute":
      variantPrompt = `Just put 50 USDC into whatever's best on Blend`;
      break;
    case "info":
      variantPrompt = `Tell me about my portfolio`;
      break;
    case "query":
      variantPrompt = `Latest APY numbers please`;
      break;
    default:
      variantPrompt = `Could you handle ${t.name.replace(/_/g, " ")} for me?`;
  }
  scenarios.push(
    render(
      `tool-${String(baseIdx).padStart(3, "0")}-variant`,
      `${intent}_variant_phrasing`,
      variantPrompt,
      happyExpect
    )
  );

  return scenarios;
}

const allScenarios: string[] = [];
allScenarios.push(`# Auto-generated by generate-tool-scenarios.ts`);
allScenarios.push(`# Total: ${tools.length} tools x 5 scenarios = ${tools.length * 5} scenarios`);
allScenarios.push(`# Regenerate: pnpm tsx loop-config/scenarios/generate-tool-scenarios.ts`);
allScenarios.push(``);

let baseIdx = 1;
const byCategory = new Map<string, ToolDef[]>();
for (const t of tools) {
  const arr = byCategory.get(t.category) ?? [];
  arr.push(t);
  byCategory.set(t.category, arr);
}

for (const [cat, catTools] of byCategory) {
  allScenarios.push(`# ============================================================`);
  allScenarios.push(
    `# Category: ${cat} (${catTools.length} tools, ${catTools.length * 5} scenarios)`
  );
  allScenarios.push(`# ============================================================`);
  for (const t of catTools) {
    allScenarios.push(``);
    allScenarios.push(`# Tool: ${t.name} - ${t.desc.slice(0, 80)}`);
    for (const s of genScenarios(t, baseIdx)) {
      allScenarios.push(s);
    }
    baseIdx++;
  }
  allScenarios.push(``);
}

writeFileSync(OUT_PATH, allScenarios.join("\n") + "\n", "utf-8");

console.log(`Generated ${tools.length} tools x 5 = ${tools.length * 5} scenarios`);
console.log(`Output: ${OUT_PATH}`);
console.log(`\nCategories:`);
for (const [cat, ts] of byCategory) {
  console.log(`  ${cat}: ${ts.length} tools -> ${ts.length * 5} scenarios`);
}
