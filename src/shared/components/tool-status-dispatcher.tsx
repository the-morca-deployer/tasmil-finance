"use client";

import { AlertCircle, Check, ChevronRight } from "lucide-react";
import { memo, useState } from "react";
import { Shimmer } from "@/features/chat/components/ai/shimmer";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { Loader } from "@/shared/ui/loader";

interface ToolStatusDispatcherProps {
  toolName?: string;
  args?: Record<string, any>;
  status?: "calling" | "complete" | "error";
  toolCallId?: string;
}

/**
 * Format tool name to be more readable
 * e.g., "blend_backstop_get_pool_data" -> "Blend Backstop Get Pool Data"
 */
function formatToolName(toolName: string): string {
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format args for compact display
 */
function formatArgs(args: Record<string, any>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return "";

  // Show first 2 args
  const formatted = entries
    .slice(0, 2)
    .map(([key, value]) => {
      if (typeof value === "string") {
        // Truncate long strings (like contract addresses)
        if (value.length > 20) {
          return `${key}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
        }
        return `${key}: ${value}`;
      }
      if (typeof value === "object") {
        return `${key}: {...}`;
      }
      return `${key}: ${value}`;
    })
    .join(", ");

  if (entries.length > 2) {
    return `${formatted}, +${entries.length - 2} more`;
  }

  return formatted;
}

/**
 * Dispatcher for tool status UI messages from LangGraph.
 * Shows which tool is being called and its execution status.
 * Styled similar to SupervisorAgentCallCard for consistency.
 */
function ToolStatusDispatcherComponent(props: ToolStatusDispatcherProps) {
  const toolName = props?.toolName || "unknown";
  const status = props?.status || "calling";
  const args = props?.args || {};
  const [isOpen, setIsOpen] = useState(false); // Default closed for cleaner UI

  const isCalling = status === "calling";
  const isError = status === "error";

  const displayName = formatToolName(toolName);
  const displayArgs = formatArgs(args);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="group flex items-center gap-2 py-1.5 text-sm transition-colors hover:opacity-80">
        {/* Status icon */}
        <div className="shrink-0">
          {isCalling ? (
            <Loader size={16} className="text-muted-foreground" />
          ) : isError ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </div>

        {/* Label with shimmer when calling */}
        <div className="min-w-0 flex-1">
          {isCalling ? (
            <Shimmer className="font-medium text-sm" duration={2}>
              {displayName}
            </Shimmer>
          ) : (
            <span className="font-medium text-muted-foreground">
              {isError ? `Failed: ${displayName}` : displayName}
            </span>
          )}
        </div>

        {/* Chevron */}
        {displayArgs && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
        )}
      </CollapsibleTrigger>

      {displayArgs && (
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="mt-1 ml-2 border-muted-foreground/20 border-l-2 py-2 pl-4">
            <p className="break-all font-mono text-muted-foreground text-xs">{displayArgs}</p>
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export const ToolStatusDispatcher = memo(ToolStatusDispatcherComponent);
