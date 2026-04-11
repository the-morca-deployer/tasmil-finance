"use client";

import { CheckCircle2, ChevronRight, Circle, FileText, Search, XCircle } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { Loader } from "@/shared/ui/loader";
import { Shimmer } from "./shimmer";

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

interface AITaskProps {
  title: string;
  status?: TaskStatus;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

interface AITaskListProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

interface AITaskItemProps {
  children: React.ReactNode;
  status?: TaskStatus;
  file?: string;
  className?: string;
}

function getStatusIcon(status?: TaskStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "in_progress":
      return <Loader size={16} className="text-muted-foreground" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

export function AITaskItem({ children, status, file, className }: AITaskItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 py-1 transition-opacity duration-200",
        status === "completed" && "opacity-60",
        className
      )}
    >
      <div className="mt-0.5 shrink-0">{getStatusIcon(status)}</div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm",
            status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {children}
        </div>
        {file && (
          <div className="mt-0.5 flex items-center gap-1">
            <FileText className="h-3 w-3 text-muted-foreground/50" />
            <span className="truncate font-mono text-muted-foreground/60 text-xs">{file}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function AITaskList({ title, children, className }: AITaskListProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function AITask({
  title,
  status = "pending",
  defaultOpen = true,
  children,
  className,
  icon,
}: AITaskProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const isActive = status === "in_progress";
  const isDone = status === "completed";
  const isFailed = status === "failed";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("group/task", className)}>
      <CollapsibleTrigger className="flex w-full items-center gap-2.5 py-1.5 text-sm transition-colors hover:opacity-80">
        {/* Icon */}
        <div className="shrink-0">
          {icon || (
            <Search
              className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")}
            />
          )}
        </div>

        {/* Title with shimmer when active */}
        <div className="flex flex-1 items-center gap-2 text-left">
          {isActive ? (
            <Shimmer className="font-medium text-sm" duration={2}>
              {title}
            </Shimmer>
          ) : (
            <span
              className={cn(
                "font-medium",
                isDone ? "text-muted-foreground" : isFailed ? "text-destructive" : "text-foreground"
              )}
            >
              {title}
            </span>
          )}
        </div>

        {/* Status icon */}
        <div className="shrink-0">{getStatusIcon(status)}</div>

        {/* Chevron */}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </CollapsibleTrigger>

      {children && (
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div
            className={cn(
              "mt-1 ml-2 border-l-2 py-2 pl-4",
              isActive
                ? "border-muted-foreground/40"
                : isDone
                  ? "border-emerald-500/30"
                  : isFailed
                    ? "border-destructive/30"
                    : "border-border/40"
            )}
          >
            {children}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
