/**
 * Re-export shim — all renderer logic has moved to:
 *   src/features/chat/actions/renderers/   (domain files)
 *   src/features/chat/lib/                 (utilities)
 */
export {
  TASMIL_INFO_TOOLS,
  SUPERVISOR_AGENTS,
  INFO_ENTRIES as INFO_TOOL_RENDERERS,
  OPERATION_ENTRIES as OPERATION_TOOL_RENDERERS,
} from "@/features/chat/actions/renderers/protocol-data";
export { BLEND_RENDERER_ENTRIES as BLEND_SHARED_INFO } from "@/features/chat/actions/renderers/blend-renderers";
export { AQUARIUS_RENDERER_ENTRIES as AQUARIUS_SHARED_INFO } from "@/features/chat/actions/renderers/aquarius-renderers";
export { executeDispatchRender as EXECUTE_DISPATCHER } from "@/features/chat/actions/renderers/execute-dispatcher";
export { FLOW_RENDERER_ENTRIES as FLOW_TOOL_RENDERERS } from "@/features/chat/actions/renderers/flow-renderers";
