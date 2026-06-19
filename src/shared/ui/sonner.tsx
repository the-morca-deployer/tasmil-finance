import { useTheme } from "next-themes";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={(theme as ToasterProps["theme"]) || "system"}
      className="toaster group"
      style={
        {
          // Use `--card` (lighter than page `--background`) so the toast
          // visibly separates from the pitch-black page on dark theme.
          // Sonner sets inline styles from these vars, so Tailwind classes
          // alone are not enough — set both layers.
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-xl",
          description: "group-[.toast]:!text-card-foreground/90",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
