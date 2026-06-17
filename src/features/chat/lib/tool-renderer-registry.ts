import type React from "react";

export type SharedRenderProps = {
  status: "inProgress" | "executing" | "complete";
  args: Record<string, unknown>;
  result: unknown;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
};

export type RendererEntry =
  | { kind: "info"; component: React.ComponentType<any>; label: string }
  | { kind: "operation"; component: React.ComponentType<any>; label: string }
  | { kind: "shared"; render: (props: SharedRenderProps) => React.ReactElement }
  | { kind: "shared-op"; render: (props: SharedRenderProps) => React.ReactElement };

export class ToolRendererRegistry {
  private _map = new Map<string, RendererEntry>();

  register(toolName: string, entry: RendererEntry): this {
    this._map.set(toolName, entry);
    return this;
  }

  get(toolName: string): RendererEntry | null {
    return this._map.get(toolName) ?? null;
  }

  has(toolName: string): boolean {
    return this._map.has(toolName);
  }

  size(): number {
    return this._map.size;
  }
}

export const toolRendererRegistry = new ToolRendererRegistry();
