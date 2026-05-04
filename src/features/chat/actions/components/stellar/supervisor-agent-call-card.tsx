"use client";

import { AlertCircle, Bot, ChevronRight } from "lucide-react";
import Image from "next/image";
import { memo, useState } from "react";
import { Shimmer } from "@/features/chat/components/ai/shimmer";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";

interface SupervisorAgentCallCardProps {
  agent?: string;
  message?: string;
  status?: "calling" | "complete" | "error";
  toolCallId?: string;
}

/**
 * Maps short agent names (from supervisor tool calls like "call_blend_agent")
 * to their display label and icon path.
 *
 * Icon paths mirror the canonical `/agents/` assets used on the /agents page
 * and in agents.config.ts.
 */
const AGENT_CONFIG: Record<string, { label: string; icon: string }> = {
  info: { label: "Info Agent", icon: "/agents/info-agent.png" },
  blend: { label: "Blend Agent", icon: "/agents/blend-agent.svg" },
  soroswap: { label: "Soroswap Agent", icon: "/agents/soroswap-agent.svg" },
  phoenix: { label: "Phoenix Agent", icon: "/agents/phoenix-agent.svg" },
  aquarius: { label: "Aquarius Agent", icon: "/agents/aquarius-agent.svg" },
  defindex: { label: "DeFindex Agent", icon: "/agents/defindex-agent.svg" },
  templar: { label: "Templar Agent", icon: "/agents/templar-agent.svg" },
  allbridge: { label: "Allbridge Agent", icon: "/agents/allbridge-agent.svg" },
  sdex: { label: "SDEX Agent", icon: "/agents/sdex-agent.svg" },
  bridge: { label: "Bridge Agent", icon: "/agents/bridge-agent-v6.png" },
  yield: { label: "Yield Agent", icon: "/agents/yield-agent-v6.png" },
  research: { label: "Research Agent", icon: "/agents/research-agent-v6.png" },
  swap: { label: "Swap Agent", icon: "/agents/soroswap-agent.svg" },
  vault: { label: "Vault Agent", icon: "/agents/defindex-agent.svg" },
  staking: { label: "Staking Agent", icon: "/agents/blend-agent.svg" },
};

const DEFAULT_CONFIG = { label: "Agent", icon: "" };

function AgentIcon({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <Bot className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={16}
      height={16}
      className={cn("h-4 w-4 rounded-full object-cover", className)}
      onError={() => setError(true)}
    />
  );
}

function SupervisorAgentCallCardComponent(props: SupervisorAgentCallCardProps) {
  const agentName = props.agent || "unknown";
  const message = props.message || "";
  const status = props.status || "calling";
  const [isOpen, setIsOpen] = useState(status === "calling");

  const config = AGENT_CONFIG[agentName] || DEFAULT_CONFIG;

  const isCalling = status === "calling";
  const isError = status === "error";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="group flex items-center gap-2 py-1.5 text-sm transition-colors hover:opacity-80">
        {/* Agent icon — always show logo, pulse when calling */}
        <div className="shrink-0">
          {isError ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <AgentIcon
              src={config.icon}
              alt={config.label}
              className={isCalling ? "animate-pulse" : undefined}
            />
          )}
        </div>

        {/* Label with shimmer when calling */}
        {isCalling ? (
          <Shimmer className="font-medium text-sm" duration={2}>
            Using {config.label}
          </Shimmer>
        ) : (
          <span className="font-medium text-muted-foreground">
            {isError ? `${config.label} failed` : `Used ${config.label}`}
          </span>
        )}

        {/* Chevron */}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {message && (
          <div className="mt-1 ml-2 border-muted-foreground/20 border-l-2 py-2 pl-4">
            <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export const SupervisorAgentCallCard = memo(SupervisorAgentCallCardComponent);
