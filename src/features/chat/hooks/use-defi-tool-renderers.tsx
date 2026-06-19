/**
 * Re-export shim — all renderer logic has moved to:
 *   src/features/chat/actions/renderers/   (domain files)
 *   src/features/chat/lib/                 (utilities)
 */

export { AQUARIUS_RENDERER_ENTRIES as AQUARIUS_SHARED_INFO } from "@/features/chat/actions/renderers/aquarius-renderers";
export { BLEND_RENDERER_ENTRIES as BLEND_SHARED_INFO } from "@/features/chat/actions/renderers/blend-renderers";
// EXECUTE_DISPATCHER is a render function (props: SharedRenderProps) => ReactElement.
// Legacy callers expecting { toolName, render } shape: import directly from execute-dispatcher.
export { executeDispatchRender as EXECUTE_DISPATCHER } from "@/features/chat/actions/renderers/execute-dispatcher";
export { FLOW_RENDERER_ENTRIES as FLOW_TOOL_RENDERERS } from "@/features/chat/actions/renderers/flow-renderers";
export {
  INFO_ENTRIES as INFO_TOOL_RENDERERS,
  OPERATION_ENTRIES as OPERATION_TOOL_RENDERERS,
  SUPERVISOR_AGENTS,
  TASMIL_INFO_TOOLS,
} from "@/features/chat/actions/renderers/protocol-data";
