"use client";

import { Bot, ChevronDown, Play, RotateCcw, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SupervisorAgentCallCard } from "@/features/chat/actions/components/stellar/supervisor-agent-call-card";
import { AIReasoning } from "@/features/chat/components/ai/ai-reasoning";
import { ClarifyCard } from "@/features/chat/components/flow/clarify-card";
import { ExecutionCard } from "@/features/chat/components/flow/execution-card";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";
import { BlendTxCard } from "@/features/protocols/cards/blend";
import { cn } from "@/lib/utils";
import { ToolStatusDispatcher } from "@/shared/components/tool-status-dispatcher";
import { Button } from "@/shared/ui/button";

// ─── Mock stream so BlendTxCard's useStreamContext() doesn't throw ──
const MOCK_STREAM = {
  messages: [],
  values: {},
  isLoading: false,
  error: undefined,
  interrupt: undefined,
  submit: async () => {},
  stop: () => {},
  getMessagesMetadata: () => undefined,
} as unknown as StreamContextType;

// ─── Flow step definitions ──────────────────────────────────────

type FlowStep =
  | { type: "user"; text: string }
  | { type: "reasoning"; content: string; duration: number }
  | { type: "agent_call"; agent: string; message: string; status: "calling" | "complete" }
  | {
      type: "tool_call";
      toolName: string;
      args: Record<string, string>;
      status: "calling" | "complete" | "error";
    }
  | { type: "text"; content: string }
  | { type: "clarify"; questions: any[] }
  | { type: "blend_tx"; tx: any }
  | {
      type: "execution";
      step: number;
      totalSteps: number;
      status: "submitting" | "confirmed" | "failed";
      txHash?: string;
      description?: string;
    }
  | { type: "divider" };

/**
 * Complete supervisor flow simulation:
 *
 * User: "I want to deposit 100 USDC to earn the best yield"
 *
 * Turn 1: Supervisor → Research Agent → discover tools → clarify card
 * Turn 2: User selects pool → Supervisor → Blend Agent → deposit → plan → execute
 */
const FLOW_STEPS: FlowStep[] = [
  // ─── Turn 1: User asks to deposit ───────────────────
  //
  // What happens behind the scenes (user does NOT see this):
  //   supervisor → parse_user_intent → call_research_agent
  //   research_agent → discover, blend_get_pool_info, aquarius_list_pools
  //   research_agent returns → supervisor → flow_clarify
  //
  // What the user ACTUALLY sees:
  { type: "user", text: "I want to deposit 100 USDC to earn the best yield" },

  // Supervisor reasoning (collapsible thinking block)
  {
    type: "reasoning",
    duration: 5,
    content:
      "The user wants to deposit 100 USDC for yield. I need to:\n\n" +
      "1. **Identify available yield opportunities** across Blend, Aquarius, DeFindex\n" +
      "2. **Compare risk-adjusted APYs** for the user's amount\n" +
      "3. **Present the best options** with clear descriptions\n\n" +
      "Let me delegate to the research agent to discover current yield pools, then present options to the user.",
  },

  // Supervisor delegates to Research Agent — ONE card, status = "complete"
  // (streamSubgraphs: false → internal tool calls are invisible to user)
  {
    type: "agent_call",
    agent: "research",
    message:
      "Find best USDC yield opportunities across all supported protocols (Blend, Aquarius, DeFindex). Include APY, TVL, and risk level.",
    status: "complete",
  },

  // Supervisor text response after research agent returns
  {
    type: "text",
    content:
      "I found several yield opportunities for your 100 USDC. Here are the best options ranked by risk-adjusted return:",
  },

  // flow_clarify tool renders ClarifyCard — user picks a pool
  {
    type: "clarify",
    questions: [
      {
        field_name: "pool",
        question: "Which pool would you like to deposit into?",
        input_type: "select",
        suggestions: [
          {
            label: "USDC Lending (Fixed Pool) \u00b7 Blend \u00b7 9.3% APY",
            value: {
              protocol: "blend",
              pool_address: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UTQOV",
              asset: "USDC",
            },
            tags: ["recommended"],
            description: "Low risk single-sided lending. $2.4M TVL.",
          },
          {
            label: "XLM/USDC LP \u00b7 Aquarius \u00b7 14.2% APY",
            value: {
              protocol: "aquarius",
              pool_address: "GDVNK2MNBSN2VOFL5DBHKYKAM",
              asset: "USDC",
            },
            tags: ["high_tvl", "il_risk"],
            description: "AMM liquidity pool. $5.1M TVL. Impermanent loss risk.",
          },
          {
            label: "USDC Stable Vault \u00b7 DeFindex \u00b7 8.1% APY",
            value: { protocol: "defindex", pool_address: "CA4NOB3SE3FAPPIY5FVRR", asset: "USDC" },
            description: "Auto-rebalancing vault across strategies. $1.8M TVL.",
          },
          {
            label: "USDC/EURC \u00b7 Soroswap \u00b7 6.5% APY",
            value: { protocol: "soroswap", pool_address: "CCVSVSUAD3NWYGFSRBC5", asset: "USDC" },
            description: "Stablecoin-only LP. Minimal IL risk. $800K TVL.",
          },
        ],
      },
    ],
  },

  { type: "divider" },

  // ─── Turn 2: User selected Blend → supervisor routes to blend agent ───
  //
  // Behind the scenes: supervisor → call_blend_agent
  //   blend_agent → blend_get_pool_info, blend_deposit (builds XDR)
  //   blend_agent returns XDR → supervisor → HITL interrupt with BlendTxCard
  //
  // What the user sees:
  { type: "user", text: "USDC Lending (Fixed Pool) \u00b7 Blend \u00b7 9.3% APY" },

  // Supervisor reasoning
  {
    type: "reasoning",
    duration: 3,
    content:
      "User chose **Blend Fixed Pool** at 9.3% APY — a safe single-sided lending position.\n\n" +
      "I'll delegate to the Blend agent to:\n" +
      "1. Verify pool status and current rates\n" +
      "2. Build and simulate the deposit transaction\n" +
      "3. Present the plan for user approval",
  },

  // Supervisor delegates to Blend Agent — ONE card, already complete
  {
    type: "agent_call",
    agent: "blend",
    message: "Deposit 100 USDC into Blend Fixed Pool. Verify pool health and build transaction.",
    status: "complete",
  },

  // BlendTxCard — HITL interrupt: user must sign or cancel
  {
    type: "blend_tx",
    tx: {
      operation: "blend_supply",
      xdr: "AAAAAgAAAABk7GOWH1...demo_xdr_placeholder...AAAAAA==",
      estimatedFee: "100",
      asset: "CCQKB3MMQHKWXLP7...USDC_CONTRACT",
      symbol: "USDC",
      amount: "1000000000", // 100 USDC in stroops (7 decimals)
      pool: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UTQOV",
      from: "GBVWAMDL...user_address",
      context: {
        reserveApy: {
          supplyApy: 9.3,
          borrowApy: 5.1,
          supplyEmissionApy: 2.1,
          borrowEmissionApy: 0,
        },
        currentPosition: {
          suppliedAmount: 250.0,
          borrowedAmount: 0,
        },
        symbol: "USDC",
      },
    },
  },

  { type: "divider" },

  // ─── Turn 3: After user signs → tx submitted & confirmed ─────────
  {
    type: "execution",
    step: 1,
    totalSteps: 1,
    status: "confirmed",
    txHash: "a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01",
  },

  // Final summary
  {
    type: "text",
    content:
      "Done! I've deposited **100 USDC** into **Blend Fixed Pool** at **9.3% APY**.\n\n" +
      "- Estimated annual earnings: **~9.30 USDC**\n" +
      "- You can withdraw anytime with no lockup period\n" +
      "- Your position will start earning interest immediately",
  },
];

// ─── Step renderer ──────────────────────────────────────────────

function FlowStepRenderer({
  step,
  animate,
  onClarifySubmit,
}: {
  step: FlowStep;
  animate: boolean;
  onClarifySubmit?: (answers: Record<string, unknown>) => void;
}) {
  const wrapperCls = cn(
    "transition-all duration-500",
    animate ? "animate-in fade-in slide-in-from-bottom-2" : ""
  );

  switch (step.type) {
    case "user":
      return (
        <div className={cn(wrapperCls, "flex justify-end")}>
          <div className="flex items-start gap-3">
            <div className="max-w-md rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {step.text}
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      );

    case "reasoning":
      return (
        <div className={wrapperCls}>
          <AIReasoning duration={step.duration} defaultOpen={false}>
            {step.content}
          </AIReasoning>
        </div>
      );

    case "agent_call":
      return (
        <div className={wrapperCls}>
          <SupervisorAgentCallCard agent={step.agent} message={step.message} status={step.status} />
        </div>
      );

    case "tool_call":
      return (
        <div className={wrapperCls}>
          <ToolStatusDispatcher toolName={step.toolName} args={step.args} status={step.status} />
        </div>
      );

    case "text":
      return (
        <div className={cn(wrapperCls, "py-1")}>
          <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">
            {step.content
              .split(/(\*\*[^*]+\*\*)/)
              .map((part, i) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={i}>{part.slice(2, -2)}</strong>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
          </div>
        </div>
      );

    case "clarify":
      return (
        <div className={wrapperCls}>
          <ClarifyCard
            questions={step.questions}
            onSubmit={onClarifySubmit ?? (() => {})}
            disabled={!onClarifySubmit}
          />
        </div>
      );

    case "blend_tx":
      return (
        <div className={cn(wrapperCls, "max-w-[400px]")}>
          <StreamContext.Provider value={MOCK_STREAM}>
            <BlendTxCard tx={step.tx} mode="playground" />
          </StreamContext.Provider>
        </div>
      );

    case "execution":
      return (
        <div className={cn(wrapperCls, "max-w-[400px]")}>
          <ExecutionCard
            step={step.step}
            totalSteps={step.totalSteps}
            status={step.status}
            txHash={step.txHash}
            description={step.description}
          />
        </div>
      );

    case "divider":
      return (
        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1 bg-border/50" />
          <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
          <div className="h-px flex-1 bg-border/50" />
        </div>
      );

    default:
      return null;
  }
}

// ─── AI message wrapper (groups non-user steps under an avatar) ─

function AiMessageGroup({
  children,
  hideAvatar = false,
}: {
  children: React.ReactNode;
  hideAvatar?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 shrink-0">
        {!hideAvatar && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-1 ring-white/10">
            <Bot className="h-4 w-4 text-emerald-400" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  );
}

// ─── Interactive flow simulation ────────────────────────────────

function FlowSimulation() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSteps = FLOW_STEPS.length;

  // Auto-scroll to latest step
  useEffect(() => {
    if (containerRef.current && visibleCount > 0) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleCount]);

  const showNextStep = useCallback(() => {
    setVisibleCount((prev) => {
      const next = prev + 1;
      if (next >= totalSteps) {
        setIsPlaying(false);
        setIsComplete(true);
        return totalSteps;
      }
      return next;
    });
  }, [totalSteps]);

  // Play loop
  useEffect(() => {
    if (!isPlaying) return;

    const currentStep = FLOW_STEPS[visibleCount];
    // Different delays for different step types to feel natural
    let delay = 400;
    if (currentStep?.type === "user") delay = 800;
    else if (currentStep?.type === "reasoning") delay = 600;
    else if (currentStep?.type === "agent_call") delay = 500;
    else if (currentStep?.type === "tool_call") delay = 350;
    else if (currentStep?.type === "text") delay = 700;
    else if (currentStep?.type === "clarify") delay = 800;
    else if (currentStep?.type === "blend_tx") delay = 900;
    else if (currentStep?.type === "execution") delay = 600;
    else if (currentStep?.type === "divider") delay = 500;

    timerRef.current = setTimeout(showNextStep, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, visibleCount, showNextStep]);

  const handlePlay = () => {
    if (isComplete) {
      // Reset
      setVisibleCount(0);
      setIsComplete(false);
    }
    setIsPlaying(true);
    showNextStep();
  };

  const handleShowAll = () => {
    setVisibleCount(totalSteps);
    setIsPlaying(false);
    setIsComplete(true);
  };

  const handleReset = () => {
    setVisibleCount(0);
    setIsPlaying(false);
    setIsComplete(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Group steps into "turns" for avatar rendering
  // A new AI turn starts after each "user" step
  const renderSteps = () => {
    const visible = FLOW_STEPS.slice(0, visibleCount);
    const elements: React.ReactNode[] = [];
    let aiGroupSteps: { step: FlowStep; idx: number }[] = [];

    const flushAiGroup = () => {
      if (aiGroupSteps.length === 0) return;
      const groupKey = `ai-group-${aiGroupSteps[0]!.idx}`;
      elements.push(
        <AiMessageGroup key={groupKey}>
          {aiGroupSteps.map(({ step, idx }) => (
            <FlowStepRenderer key={idx} step={step} animate={idx === visibleCount - 1} />
          ))}
        </AiMessageGroup>
      );
      aiGroupSteps = [];
    };

    visible.forEach((step, idx) => {
      if (step.type === "user") {
        flushAiGroup();
        elements.push(
          <FlowStepRenderer key={idx} step={step} animate={idx === visibleCount - 1} />
        );
      } else if (step.type === "divider") {
        flushAiGroup();
        elements.push(
          <FlowStepRenderer key={idx} step={step} animate={idx === visibleCount - 1} />
        );
      } else {
        aiGroupSteps.push({ step, idx });
      }
    });

    flushAiGroup();
    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <Button onClick={handlePlay} variant="default" size="sm" className="gap-2">
            <Play className="h-3.5 w-3.5" />
            {isComplete ? "Replay" : visibleCount === 0 ? "Play Flow" : "Resume"}
          </Button>
        ) : (
          <Button
            onClick={() => setIsPlaying(false)}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            Pause
          </Button>
        )}

        {visibleCount < totalSteps && (
          <Button onClick={handleShowAll} variant="outline" size="sm" className="gap-2">
            Show All
          </Button>
        )}

        {visibleCount > 0 && (
          <Button onClick={handleReset} variant="ghost" size="sm" className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}

        <span className="ml-auto font-mono text-muted-foreground text-xs tabular-nums">
          {visibleCount} / {totalSteps} steps
        </span>
      </div>

      {/* Chat simulation area */}
      <div
        ref={containerRef}
        className="relative max-h-[700px] overflow-y-auto rounded-xl border border-border bg-background p-4"
      >
        {visibleCount === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
            Press "Play Flow" to simulate the supervisor agent flow
          </div>
        ) : (
          <div className="flex flex-col gap-3">{renderSteps()}</div>
        )}
      </div>
    </div>
  );
}

// ─── Static showcase: all components side-by-side ───────────────

function ComponentShowcase() {
  const [section, setSection] = useState<string | null>(null);

  const sections = [
    {
      id: "reasoning",
      title: "AI Reasoning",
      description: "Collapsible thinking blocks showing the agent's thought process",
    },
    {
      id: "agents",
      title: "Agent Delegation",
      description: "Supervisor delegates work to specialized agents",
    },
    {
      id: "tools",
      title: "Tool Calls",
      description: "Individual MCP tool calls with status indicators",
    },
    {
      id: "clarify",
      title: "Clarify Card",
      description: "Agent asks user to select from options or provide input",
    },
    {
      id: "operation",
      title: "Operation Card",
      description: "Protocol-specific confirm card (BlendTxCard) with sign/cancel",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section nav */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(section === s.id ? null : s.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              section === s.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/30"
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Component preview */}
      {section === "reasoning" && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-xs">
            Streaming state (auto-opens, timer counts):
          </p>
          <AIReasoning isStreaming={false} duration={5} defaultOpen>
            The user wants to deposit 100 USDC. Let me check available yield opportunities across
            Blend, Aquarius, and DeFindex protocols to find the best risk-adjusted return.
          </AIReasoning>
          <p className="text-muted-foreground text-xs">Completed state (collapsed by default):</p>
          <AIReasoning duration={12} defaultOpen={false}>
            Analyzed 8 pools across 3 protocols. Blend Fixed Pool offers the best risk-adjusted
            yield at 9.3% APY with $2.4M TVL. Aquarius XLM/USDC has higher APY (14.2%) but carries
            impermanent loss risk.
          </AIReasoning>
        </div>
      )}

      {section === "agents" && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-xs">Calling state (shimmer animation):</p>
          <SupervisorAgentCallCard
            agent="research"
            message="Find best USDC yield opportunities across all supported protocols"
            status="calling"
          />
          <p className="text-muted-foreground text-xs">Completed state:</p>
          <SupervisorAgentCallCard
            agent="blend"
            message="Deposit 100 USDC into Blend Fixed Pool"
            status="complete"
          />
          <p className="text-muted-foreground text-xs">All agent types:</p>
          <div className="space-y-1">
            {[
              "info",
              "blend",
              "soroswap",
              "phoenix",
              "aquarius",
              "defindex",
              "templar",
              "allbridge",
              "sdex",
              "bridge",
              "yield",
              "research",
            ].map((agent) => (
              <SupervisorAgentCallCard
                key={agent}
                agent={agent}
                message={`Task delegated to ${agent} agent`}
                status="complete"
              />
            ))}
          </div>
        </div>
      )}

      {section === "tools" && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-xs">Calling state (spinner):</p>
          <ToolStatusDispatcher
            toolName="blend_get_pool_info"
            args={{ pool_id: "CBHCR...UTQOV", network: "mainnet" }}
            status="calling"
          />
          <p className="text-muted-foreground text-xs">Complete state (check mark):</p>
          <ToolStatusDispatcher
            toolName="discover"
            args={{ asset: "USDC", type: "yield" }}
            status="complete"
          />
          <p className="text-muted-foreground text-xs">Error state:</p>
          <ToolStatusDispatcher
            toolName="blend_deposit"
            args={{ amount: "100", asset: "USDC" }}
            status="error"
          />
        </div>
      )}

      {section === "clarify" && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-xs">
            Single question — agent generates options dynamically:
          </p>
          <ClarifyCard
            questions={[
              {
                field_name: "pool",
                question: "Which pool would you like to deposit into?",
                input_type: "select" as const,
                suggestions: [
                  {
                    label: "USDC Lending (Fixed Pool) \u00b7 Blend \u00b7 9.3% APY",
                    value: { protocol: "blend", pool: "fixed" },
                    tags: ["recommended"],
                    description: "Low risk single-sided lending",
                  },
                  {
                    label: "XLM/USDC LP \u00b7 Aquarius \u00b7 14.2% APY",
                    value: { protocol: "aquarius", pool: "xlm-usdc" },
                    tags: ["high_tvl", "il_risk"],
                    description: "AMM liquidity pool",
                  },
                ],
              },
            ]}
            onSubmit={(answers) => console.warn("[Demo] clarify submit:", answers)}
          />
          <p className="text-muted-foreground text-xs">
            Multi-question stepper (2+ missing fields):
          </p>
          <ClarifyCard
            questions={[
              {
                field_name: "pair",
                question: "Which pair to swap?",
                input_type: "select" as const,
                suggestions: [
                  { label: "XLM \u2192 USDC", value: { from: "XLM", to: "USDC" } },
                  { label: "USDC \u2192 XLM", value: { from: "USDC", to: "XLM" } },
                ],
              },
              {
                field_name: "amount",
                question: "How much do you want to swap?",
                input_type: "text" as const,
                placeholder: "e.g. 100 XLM",
              },
            ]}
            onSubmit={(answers) => console.warn("[Demo] multi-clarify submit:", answers)}
          />
        </div>
      )}

      {section === "operation" && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-muted-foreground text-xs">
            BlendTxCard — the actual protocol confirm card used in chat and playground:
          </p>
          <div className="max-w-[400px]">
            <StreamContext.Provider value={MOCK_STREAM}>
              <BlendTxCard
                tx={{
                  operation: "blend_supply",
                  xdr: "AAAAAgAAAABk7GOWH1...demo_xdr...AAAAAA==",
                  estimatedFee: "100",
                  symbol: "USDC",
                  amount: "1000000000",
                  pool: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UTQOV",
                  context: {
                    reserveApy: { supplyApy: 9.3, borrowApy: 5.1 },
                    currentPosition: { suppliedAmount: 250.0, borrowedAmount: 0 },
                    symbol: "USDC",
                  },
                }}
                mode="playground"
              />
            </StreamContext.Provider>
          </div>
          <p className="text-muted-foreground text-xs">Borrow operation:</p>
          <div className="max-w-[400px]">
            <StreamContext.Provider value={MOCK_STREAM}>
              <BlendTxCard
                tx={{
                  operation: "blend_borrow",
                  xdr: "AAAAAgAAAABk7GOWH1...demo_xdr_borrow...AAAAAA==",
                  estimatedFee: "150",
                  symbol: "XLM",
                  amount: "5000000000",
                  pool: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UTQOV",
                  context: {
                    reserveApy: { supplyApy: 3.2, borrowApy: 5.8 },
                    currentPosition: { suppliedAmount: 0, borrowedAmount: 100.0 },
                    symbol: "XLM",
                  },
                }}
                mode="playground"
              />
            </StreamContext.Provider>
          </div>
        </div>
      )}

      {/* Plan Preview and Execution sections removed — not used in current flow */}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────

export default function AIDemoPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-10 p-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">AI Chat Flow Demo</h1>
        <p className="text-muted-foreground">
          Interactive simulation of the supervisor agent flow — shows what users see when
          interacting with the DeFi AI assistant.
        </p>
      </div>

      {/* ─── Full Flow Simulation ──────────────────────────── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-2xl">Supervisor Flow Simulation</h2>
          <p className="text-muted-foreground text-sm">
            Complete flow: User asks to deposit USDC → Supervisor thinks → Research Agent discovers
            yield → User picks pool → Blend Agent deposits → Transaction confirmed
          </p>
        </div>

        <FlowSimulation />
      </section>

      {/* ─── Component Reference ──────────────────────────── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-2xl">Component Reference</h2>
          <p className="text-muted-foreground text-sm">
            Each component used in the supervisor flow — click to inspect individually
          </p>
        </div>

        <ComponentShowcase />
      </section>

      {/* ─── Architecture diagram ────────────────────────── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-2xl">Flow Architecture</h2>
          <p className="text-muted-foreground text-sm">
            How the supervisor coordinates agents and tools behind the scenes
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-5 font-mono text-sm">
            {/* Two columns: what user sees vs what happens behind the scenes */}
            <div className="grid grid-cols-2 gap-6 border-b border-border pb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                User sees
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Behind the scenes
              </div>
            </div>

            {/* Turn 1 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="rounded bg-cyan-500/10 px-2 py-0.5 text-cyan-400 text-xs w-fit">
                  AIReasoning
                </div>
                <div className="rounded bg-yellow-500/10 px-2 py-0.5 text-yellow-400 text-xs w-fit">
                  Used Research Agent
                </div>
                <div className="text-muted-foreground text-xs">Text response</div>
                <div className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-400 text-xs w-fit">
                  ClarifyCard
                </div>
              </div>
              <div className="space-y-1.5 border-l-2 border-border/40 pl-4">
                <div className="text-muted-foreground text-xs">parse_user_intent</div>
                <div className="text-muted-foreground text-xs">call_research_agent</div>
                <div className="ml-3 space-y-0.5 border-l border-emerald-500/20 pl-2">
                  <div className="text-emerald-400/70 text-xs">discover</div>
                  <div className="text-emerald-400/70 text-xs">blend_get_pool_info</div>
                  <div className="text-emerald-400/70 text-xs">aquarius_list_pools</div>
                </div>
                <div className="text-muted-foreground text-xs">flow_clarify</div>
              </div>
            </div>

            <div className="h-px bg-border/30" />

            {/* Turn 2 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="rounded bg-cyan-500/10 px-2 py-0.5 text-cyan-400 text-xs w-fit">
                  AIReasoning
                </div>
                <div className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-400 text-xs w-fit">
                  Used Blend Agent
                </div>
                <div className="rounded bg-green-500/10 px-2 py-0.5 text-green-400 text-xs w-fit">
                  BlendTxCard (HITL)
                </div>
              </div>
              <div className="space-y-1.5 border-l-2 border-border/40 pl-4">
                <div className="text-muted-foreground text-xs">call_blend_agent</div>
                <div className="ml-3 space-y-0.5 border-l border-emerald-500/20 pl-2">
                  <div className="text-emerald-400/70 text-xs">blend_get_pool_info</div>
                  <div className="text-emerald-400/70 text-xs">blend_get_reserve_info</div>
                  <div className="text-emerald-400/70 text-xs">blend_deposit (builds XDR)</div>
                </div>
                <div className="text-muted-foreground text-xs">HITL interrupt → user signs</div>
              </div>
            </div>

            <div className="h-px bg-border/30" />

            {/* Turn 3 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="rounded bg-green-500/10 px-2 py-0.5 text-green-400 text-xs w-fit">
                  ExecutionCard
                </div>
                <div className="text-muted-foreground text-xs">Final summary text</div>
              </div>
              <div className="space-y-1.5 border-l-2 border-border/40 pl-4">
                <div className="text-muted-foreground text-xs">submit_transaction</div>
                <div className="text-muted-foreground text-xs">resume graph → final response</div>
              </div>
            </div>

            <div className="text-muted-foreground">
              <span className="text-foreground">Final Response</span>
              {" → summary + position details"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
