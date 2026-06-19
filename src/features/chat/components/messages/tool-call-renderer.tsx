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

  // Several flow tools render the same Confirm Supply card: flow_compose_plan
  // and flow_compose_and_execute auto-run the execute engine and return its
  // result, while the MCP `execute` tool also renders one. When more than one
  // card-producing call exists — repeated compose attempts after the user
  // refines the request, or a compose followed by a redundant execute — only
  // the latest one is actionable. Keep every status row but suppress the
  // stale signing cards so only the latest card is shown.
  const supersededCardCalls = useMemo(() => {
    // Across the current turn (last human message → end) multiple tools can
    // render the same Confirm Supply card: flow_compose_plan builds a rich
    // card (amount/APY/fee), `execute` only a bare "Protocol" wrapper, and
    // flow_compose_and_execute is the combined form. The LLM sometimes fires
    // compose + execute in parallel; both eventually produce a card.
    //
    // Pick exactly one WINNER for the whole turn by priority (lower index =
    // richer card) and suppress every other card render in the turn — even
    // when the calls are spread across multiple AI messages. The associated
    // status rows are untouched, only the card render is gated.
    const PRIORITY: string[] = ["flow_compose_plan", "flow_compose_and_execute", "execute"];
    const CARD_TOOL_NAMES = new Set(PRIORITY);
    const priorityOf = (name: string) => {
      const idx = PRIORITY.indexOf(name);
      return idx === -1 ? Number.POSITIVE_INFINITY : idx;
    };
    const stale = new Set<string>();
    const msgIdx = messages.findIndex((m) => m.id === message?.id);
    if (msgIdx === -1) return stale;
    const myCardCalls = toolCalls.filter((tc) => CARD_TOOL_NAMES.has(tc.name));
    if (myCardCalls.length === 0) return stale;

    // Find the start of the current turn — last human message at or before me.
    let turnStart = 0;
    for (let i = msgIdx; i >= 0; i--) {
      if ((messages[i] as any)?.type === "human") {
        turnStart = i + 1;
        break;
      }
    }

    // Collect every card call in the turn with its (priority, message index,
    // position in tool_calls). Lower priority wins; ties broken by LATER
    // message and LATER position so successive supersedes work.
    type Candidate = { id: string; prio: number; msgIdx: number; pos: number };
    const candidates: Candidate[] = [];
    for (let i = turnStart; i < messages.length; i++) {
      const m = messages[i] as any;
      if (m?.type !== "ai" || !Array.isArray(m.tool_calls)) continue;
      m.tool_calls.forEach((tc: any, pos: number) => {
        if (!tc?.id || !CARD_TOOL_NAMES.has(tc.name)) return;
        candidates.push({ id: tc.id, prio: priorityOf(tc.name), msgIdx: i, pos });
      });
    }
    if (candidates.length <= 1) return stale;

    let winner = candidates[0]!;
    for (let i = 1; i < candidates.length; i++) {
      const c = candidates[i]!;
      if (
        c.prio < winner.prio ||
        (c.prio === winner.prio && c.msgIdx > winner.msgIdx) ||
        (c.prio === winner.prio && c.msgIdx === winner.msgIdx && c.pos > winner.pos)
      ) {
        winner = c;
      }
    }
    for (const c of candidates) {
      if (c.id !== winner.id && myCardCalls.some((tc) => tc.id === c.id)) {
        stale.add(c.id);
      }
    }
    return stale;
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
              !supersededCardCalls.has(tc.id) &&
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
