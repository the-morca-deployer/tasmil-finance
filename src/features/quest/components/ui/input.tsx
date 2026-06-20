import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[50px] w-full rounded-[14px]",
          "border border-white/[0.14] bg-input",
          "px-[18px] py-[13px] text-[15px] text-foreground",
          "placeholder:text-muted-foreground",
          "outline-none",
          "transition-all duration-[250ms]",
          "hover:border-white/[0.28]",
          "focus-visible:border-white/[0.45] focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.07)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
