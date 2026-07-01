import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[100px] border px-[16px] py-[7px] text-[12px] font-bold tracking-[0.14em] uppercase transition-colors cursor-default",
  {
    variants: {
      variant: {
        default: "text-[#67E8F9] bg-[rgba(103,232,249,0.14)] border-[rgba(103,232,249,0.28)]",
        accent: "text-[#67E8F9] bg-[rgba(103,232,249,0.14)] border-[rgba(103,232,249,0.28)]",
        ongoing: "text-[#67E8F9] bg-[rgba(103,232,249,0.14)] border-[rgba(103,232,249,0.28)]",
        closed: "text-[#a1a1aa] bg-[#0D111A] border-white/[0.08]",
        glow: "text-[#67E8F9] bg-[rgba(103,232,249,0.14)] border-[#67E8F9] shadow-[0_0_14px_-4px_rgba(103,232,249,0.5)]",
        secondary: "text-[#a1a1aa] bg-[#0D111A] border-white/[0.14]",
        outline: "text-[#71717a] bg-transparent border-white/[0.08]",
        destructive: "text-[#F4F7FB] bg-destructive/20 border-destructive/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
