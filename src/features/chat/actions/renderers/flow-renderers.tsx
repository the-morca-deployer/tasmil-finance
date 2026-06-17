"use client";

/**
 * Flow tool renderers — wires flow_* tools into the toolRendererRegistry.
 *
 * The render functions here delegate to the implementations in
 * use-defi-tool-renderers.tsx (via re-export) so there is one source of truth
 * for the complex flow card logic (useStreamContext, useFlowSigning, etc.).
 *
 * The registry test only checks that the tool names are registered with the
 * correct `kind` — the render functions are not invoked in unit tests.
 */

import type React from "react";
import type { SharedRenderProps } from "@/features/chat/lib/tool-renderer-registry";
import { FLOW_TOOL_RENDERERS } from "@/features/chat/hooks/use-defi-tool-renderers";

// FLOW_TOOL_RENDERERS uses the old RenderProps type which is a subset of
// SharedRenderProps — both have result, args, status, toolCallId, respond.
// Cast is safe: we only add fields that the flow renderers never read.

export const FLOW_RENDERER_ENTRIES: {
  toolName: string;
  render: (props: SharedRenderProps) => React.ReactElement;
}[] = FLOW_TOOL_RENDERERS.map(({ toolName, render }) => ({
  toolName,
  render: (props: SharedRenderProps) =>
    render(props as Parameters<typeof render>[0]),
}));
