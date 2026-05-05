import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ children, action, className }: Props) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#555]">
        {children}
      </span>
      {action}
    </div>
  );
}
