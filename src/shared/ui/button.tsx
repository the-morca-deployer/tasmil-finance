import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

// Single canonical Button for the whole app. The `gradient` / `brand` variants
// use the shared Tasmil brand gradient (see .brand-gradient-interactive in
// globals.css) so primary CTAs look identical from landing through the app.
const buttonVariants = cva(
  "inline-flex transform-gpu cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Canonical primary CTA - Tasmil brand gradient (design system).
        gradient: "brand-gradient-interactive rounded-full font-bold",
        brand: "brand-gradient-interactive rounded-full font-bold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
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
  /** Optional leading logo (rendered in a rounded chip before the label). */
  logo?: string;
  logoAlt?: string;
  logoSize?: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, logo, logoAlt, logoSize = 20, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const content = (
      <>
        {logo && (
          <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <Image
              alt={logoAlt || "Logo"}
              height={logoSize}
              loading="eager"
              quality={90}
              src={logo}
              width={logoSize}
            />
          </span>
        )}
        {children}
      </>
    );

    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          <span style={{ display: "contents" }}>{content}</span>
        </Comp>
      );
    }

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {content}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
