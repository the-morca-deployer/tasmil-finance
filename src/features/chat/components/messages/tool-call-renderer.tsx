"use client";

import type { Message } from "@langchain/langgraph-sdk";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { SupervisorAgentCallCard } from "@/features/chat/actions/components/stellar/supervisor-agent-call-card";
import {
  SUPERVISOR_AGENTS,
  TASMIL_INFO_TOOLS,
  toolRendererRegistry,
} from "@/features/chat/actions/renderers/index";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import { parseToolResult } from "@/features/chat/lib/parse-tool-result";
import type { RendererEntry, SharedRenderProps } from "@/features/chat/lib/tool-renderer-registry";
import { ToolStatusDispatcher } from "@/shared/components/tool-status-dispatcher";

interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

const respondedToolCalls = new Set<string>();

function BlendOpWithRespond({
  toolCallId,
  toolName,
  renderProps,
  entry,
}: {
  toolCallId: string;
  toolName: string;
  renderProps: SharedRenderProps;
  entry: RendererEntry & { kind: "shared" | "shared-op" };
}) {
  const stream = useStreamContext();
  const respond = useCallback(
    async (result: Record<string, unknown>) => {
      if (respondedToolCalls.has(toolCallId)) return;
      respondedToolCalls.add(toolCallId);
      const success = Boolean(result.success);
      try {
        if (stream.interrupt) {
          await stream.submit(
            {},
            {
              command: {
                update: {
                  messages: [
                    {
                      type: "tool",
                      tool_call_id: toolCallId,
                      id: `__do_not_render__${uuidv4()}`,
                      name: toolName,
                      content: JSON.stringify(result),
                    },
                  ],
                },
                resume: { decisions: [{ type: success ? "approve" : "reject" }] },
              },
            }
          );
        } else {
          const msg = success
            ? `Transaction confirmed for ${toolName}`
            : result.reason
              ? String(result.reason)
              : "I want to cancel this transaction";
          await stream.submit({
            messages: [
              { type: "human" as const, content: msg, id: `__hidden__respond-${uuidv4()}` },
            ],
          });
        }
        if (!success) toast.info("Transaction cancelled");
      } catch (error) {
        console.error("[BlendOpWithRespond] Error resuming graph:", error);
      }
    },
    [stream, toolCallId, toolName]
  );
  return entry.render({ ...renderProps, respond });
}

export function ToolCallRenderer({ message, messages }: { message: Message; messages: Message[] }) {
  const toolCalls: ToolCallData[] =
    message && "tool_calls" in message ? ((message.tool_calls as ToolCallData[]) ?? []) : [];

  const resultMap = useMemo(() => {
    const map = new Map<string, { content: unknown; hasError: boolean }>();
    const msgIdx = messages.findIndex((m) => m.id === message?.id);
    if (msgIdx === -1) return map;
    for (let i = msgIdx + 1; i < messages.length; i++) {
      const m = messages[i] as any;
      if (m.type === "tool" && m.tool_call_id) {
        const mid = m.id as string | undefined;
        if (mid?.startsWith("do-not-render") || mid?.startsWith("__do_not_render__")) continue;
        const parsed = parseToolResult(m.content);
        const hasError =
          typeof parsed === "object" &&
          parsed !== null &&
          ("error" in parsed || (parsed as any).success === false);
        if (map.has(m.tool_call_id) && typeof parsed === "string") continue;
        map.set(m.tool_call_id, { content: parsed, hasError });
      }
      if (m.type === "human") break;
    }
    return map;
  }, [messages, message?.id]);

  const duplicateSupervisorCalls = useMemo(() => {
    const dupes = new Set<string>();
    const msgIdx = messages.findIndex((m) => m.id === message?.id);
    if (msgIdx <= 0) return dupes;
    for (const tc of toolCalls) {
      if (!tc.name.startsWith("call_") || !tc.name.endsWith("_agent")) continue;
      const argsKey = JSON.stringify(tc.args);
      for (let i = 0; i < msgIdx; i++) {
        const prev = messages[i] as any;
        if (prev.type !== "ai" || !prev.tool_calls?.length) continue;
        if (
          prev.tool_calls.some(
            (pc: any) => pc.name === tc.name && JSON.stringify(pc.args) === argsKey
          )
        ) {
          dupes.add(tc.id);
          break;
        }
      }
    }
    return dupes;
  }, [messages, message?.id, toolCalls]);

  if (toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((tc) => {
        const result = resultMap.get(tc.id);
        const isComplete = !!result;

        if (tc.name.startsWith("call_") && tc.name.endsWith("_agent")) {
          if (duplicateSupervisorCalls.has(tc.id)) return null;
          const agentName = tc.name.replace("call_", "").replace("_agent", "");
          if (SUPERVISOR_AGENTS.includes(agentName)) {
            return (
              <SupervisorAgentCallCard
                key={tc.id}
                agent={agentName}
                message={(tc.args as Record<string, string>)?.message}
                status={isComplete ? "complete" : "calling"}
              />
            );
          }
        }

        // O(1) registry lookup — replaces 3 separate O(n) .find() calls
        const entry = isComplete ? toolRendererRegistry.get(tc.name) : null;
        const shouldRenderCard =
          entry && !(entry.kind === "info" && !TASMIL_INFO_TOOLS.has(tc.name));
        const status = result?.hasError ? "error" : isComplete ? "complete" : "calling";
        const renderProps: SharedRenderProps = {
          status: "complete",
          args: tc.args as Record<string, unknown>,
          result: result?.content,
          toolCallId: tc.id,
        };

        return (
          <div key={tc.id} className="flex flex-col gap-1">
            <ToolStatusDispatcher
              toolName={tc.name}
              args={tc.args as Record<string, any>}
              status={status as "calling" | "complete" | "error"}
              toolCallId={tc.id}
            />
            {isComplete &&
              shouldRenderCard &&
              !(result?.hasError && (entry.kind === "shared-op" || entry.kind === "operation")) &&
              (entry.kind === "shared-op" || entry.kind === "shared" ? (
                <div className="max-w-[360px]">
                  <BlendOpWithRespond
                    toolCallId={tc.id}
                    toolName={tc.name}
                    renderProps={renderProps}
                    entry={entry as RendererEntry & { kind: "shared" | "shared-op" }}
                  />
                </div>
              ) : (
                <entry.component
                  type={entry.kind === "info" ? entry.label : undefined}
                  operation={entry.kind === "operation" ? entry.label : undefined}
                  toolName={tc.name}
                  args={tc.args}
                  result={result?.content}
                  status="complete"
                  toolCallId={tc.id}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
