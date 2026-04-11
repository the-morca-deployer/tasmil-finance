"use client";

import { Search } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { ProtocolBadge, ScrollableList } from "../base/indicators";
import { BaseInfoCard } from "../base/info-card";

interface ActionInfo {
  id: string;
  tool: string;
  description: string;
  params: string[];
  protocols?: string[];
}

interface ActionSearchData {
  actions: ActionInfo[];
  count: number;
  hint?: string;
}

interface ActionSearchCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function ActionSearchCardComponent({ args, result, toolCallId, status }: ActionSearchCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<ActionSearchData>(
    result,
    status
  );

  return (
    <BaseInfoCard
      title="Available Actions"
      subtitle={args?.intent ? `"${args.intent}"` : `${data?.count ?? 0} actions found`}
      icon={Search}
      iconColor="text-amber-500"
      iconBg="bg-amber-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {data?.hint && (
        <div className="mb-2 rounded bg-muted/30 p-2 text-muted-foreground text-xs">
          {data.hint}
        </div>
      )}

      {data?.actions && data.actions.length > 0 ? (
        <ScrollableList id={`actions-${toolCallId}`} maxHeight={300}>
          {data.actions.map((action, idx) => (
            <div key={action.id ?? idx} className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{action.id}</span>
                <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-muted-foreground text-xs">
                  {action.tool}
                </span>
              </div>
              <div className="text-muted-foreground text-xs">{action.description}</div>
              {action.params.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {action.params.map((p) => (
                    <span
                      key={p}
                      className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {action.protocols && action.protocols.length > 0 && (
                <div className="flex gap-1">
                  {action.protocols.map((p) => (
                    <ProtocolBadge key={p} name={p} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </ScrollableList>
      ) : (
        <div className="text-muted-foreground text-sm">No matching actions found.</div>
      )}
    </BaseInfoCard>
  );
}

export const ActionSearchCard = memo(ActionSearchCardComponent);
