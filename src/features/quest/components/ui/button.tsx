import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Quest Button component — replaces `.btn` CSS classes from globals.css
 * (.btn, .btn-primary, .btn-ghost, .btn-accent, .btn-green, .btn-sm, .btn-lg, .btn-block, .btn-pulse)
 *
 * Base: inline-flex items-center justify-center gap-[9px] px-[26px] py-[14px]
 *       rounded-quest-pill font-[var(--font)] text-[15px] font-bold tracking-[-0.01em]
 *       cursor-pointer border border-transparent
 *       transition-[transform,box-shadow,background,border-color]
 *       whitespace-nowrap no-underline
 *       disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
 *
 * Arrow: add `group` to Button, wrap arrow in <span className="inline-flex transition-transform
 *        duration-[350ms] ease-quest group-hover:translate-x-1" aria-hidden />
 */

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-[9px] px-[26px] py-[14px]",
    "rounded-quest-pill text-[15px] font-bold tracking-[-0.01em]",
    "cursor-pointer border border-transparent",
    "transition-[transform,box-shadow,background,border-color] duration-[350ms] ease-quest",
    "whitespace-nowrap no-underline",
    "group", // for .arr child hover
    "disabled:opacity-55 disabled:cursor-not-allowed disabled:!transform-none disabled:!shadow-none",
  ].join(" "),
  {
    variants: {
      variant: {
        // .btn-primary: background:var(--grad); color:var(--accent-ink);
        // hover: transform:translateY(-2px); box-shadow:0 12px 40px -8px var(--accent-glow);
        primary: [
          "[background:var(--quest-grad)] text-[var(--quest-accent-ink)]",
          "hover:-translate-y-[2px] hover:shadow-[0_12px_40px_-8px_var(--color-quest-accent-glow)]",
        ].join(" "),
        // .btn-ghost: background:rgba(255,255,255,0.04); border-color:var(--line-2); color:var(--text); backdrop-filter:blur(8px);
        // hover: background:rgba(255,255,255,0.09); border-color:var(--accent); transform:translateY(-2px);
        ghost: [
          "bg-white/[0.04] border-[var(--quest-line-2)] text-[var(--quest-text)] backdrop-blur-[8px]",
          "hover:bg-white/[0.09] hover:border-[var(--quest-accent)] hover:-translate-y-[2px]",
        ].join(" "),
        // .btn-accent: background:var(--accent-soft); border-color:var(--accent-line); color:var(--accent);
        // hover: background:rgba(103,232,249,0.22); border-color:var(--accent); transform:translateY(-2px);
        accent: [
          "bg-quest-accent-soft border-quest-accent-line text-quest-accent",
          "hover:bg-[rgba(103,232,249,0.22)] hover:border-quest-accent hover:-translate-y-[2px]",
        ].join(" "),
        // .btn-green: background:linear-gradient(110deg,#fff,var(--green) 60%,#0f9b6c); color:#03241a;
        // hover: transform:translateY(-2px); box-shadow:0 12px 40px -8px rgba(110,231,183,0.45);
        green: [
          "[background:linear-gradient(110deg,#fff,var(--quest-green)_60%,#0f9b6c)] text-[#03241a]",
          "hover:-translate-y-[2px] hover:shadow-[0_12px_40px_-8px_rgba(110,231,183,0.45)]",
        ].join(" "),
      },
      size: {
        // .btn base: padding:14px 26px; font-size:15px;
        default: "",
        // .btn-sm: padding:10px 18px; font-size:13.5px;
        sm: "px-[18px] py-[10px] text-[13.5px]",
        // .btn-lg: padding:17px 32px; font-size:16.5px;
        lg: "px-[32px] py-[17px] text-[16.5px]",
      },
      block: {
        true: "w-full",
        false: "",
      },
      pulse: {
        true: "animate-[ctapulse_2.4s_ease_infinite]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      block: false,
      pulse: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, pulse, asChild: _asChild, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, block, pulse }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

/**
 * Helper that returns the button class string — use this for non-button elements like <a> or <Link>:
 *   <Link href="..." className={buttonClasses({ variant: "primary", size: "lg" })}>
 */
export function buttonClasses(
  opts: VariantProps<typeof buttonVariants> & { className?: string }
): string {
  const { className, ...variantOpts } = opts;
  return cn(buttonVariants(variantOpts), className);
}

export { Button, buttonVariants };
