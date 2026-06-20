"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[100px] font-semibold text-[15px] tracking-[-0.01em]",
    "cursor-pointer border border-transparent",
    "transition-all duration-[400ms]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67E8F9] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Primary CTA — white → aqua gradient */
        default:
          "bg-[linear-gradient(110deg,#fff_0%,#67E8F9_52%,#0EA5E9_100%)] text-[#04141A] " +
          "hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]",
        primary:
          "bg-[linear-gradient(110deg,#fff_0%,#67E8F9_52%,#0EA5E9_100%)] text-[#04141A] " +
          "hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]",
        gradient:
          "bg-[linear-gradient(110deg,#fff_0%,#67E8F9_52%,#0EA5E9_100%)] text-[#04141A] " +
          "hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]",

        /* Ghost — translucent dark with border */
        ghost:
          "bg-white/[0.04] border-white/[0.14] text-[#F4F7FB] backdrop-blur-sm " +
          "hover:bg-white/[0.09] hover:border-[#67E8F9] hover:-translate-y-0.5",

        /* Accent — aqua tint */
        accent:
          "bg-[rgba(103,232,249,0.14)] border-[rgba(103,232,249,0.30)] text-[#67E8F9] " +
          "hover:bg-[rgba(103,232,249,0.22)] hover:border-[#67E8F9] hover:-translate-y-0.5",

        /* Outline — same as ghost */
        outline:
          "bg-white/[0.04] border-white/[0.14] text-[#F4F7FB] " +
          "hover:bg-white/[0.09] hover:border-[#67E8F9] hover:-translate-y-0.5",

        /* Secondary */
        secondary:
          "bg-[#0D111A] border-white/[0.14] text-[#F4F7FB] " +
          "hover:border-[#67E8F9] hover:-translate-y-0.5",

        /* Destructive */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        /* Link */
        link: "text-[#67E8F9] underline-offset-4 hover:underline",
      },
      size: {
        default:   "h-[52px] px-[26px] py-[14px]",
        sm:        "h-[40px] px-[20px] py-[10px] text-sm",
        lg:        "h-[60px] px-[34px] py-[18px] text-[17px]",
        icon:      "h-[46px] w-[46px] p-0",
        "icon-sm": "h-[36px] w-[36px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
