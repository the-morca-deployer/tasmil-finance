import { toolRendererRegistry } from "@/features/chat/lib/tool-renderer-registry";
import { AQUARIUS_RENDERER_ENTRIES } from "./aquarius-renderers";
import { BLEND_RENDERER_ENTRIES } from "./blend-renderers";
import { executeDispatchRender } from "./execute-dispatcher";
import { FLOW_RENDERER_ENTRIES } from "./flow-renderers";
import { INFO_ENTRIES, OPERATION_ENTRIES } from "./protocol-data";

for (const { toolName, entry } of INFO_ENTRIES) toolRendererRegistry.register(toolName, entry);
for (const { toolName, entry } of OPERATION_ENTRIES) toolRendererRegistry.register(toolName, entry);
// FIX: previously exported but never imported — Blend/Aquarius cards never rendered in production
for (const { toolName, entry } of BLEND_RENDERER_ENTRIES)
  toolRendererRegistry.register(toolName, entry);
for (const { toolName, entry } of AQUARIUS_RENDERER_ENTRIES)
  toolRendererRegistry.register(toolName, entry);
toolRendererRegistry.register("execute", { kind: "shared-op", render: executeDispatchRender });
for (const { toolName, render } of FLOW_RENDERER_ENTRIES) {
  toolRendererRegistry.register(toolName, { kind: "shared", render });
}

export { toolRendererRegistry };
export { SUPERVISOR_AGENTS, TASMIL_INFO_TOOLS } from "./protocol-data";
