import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  return (
    <>
      {/* Scrim / backdrop overlay */}
      <div
        id="navScrim"
        className={cn(
          "fixed inset-0 z-[140]",
          "bg-black/[0.72] backdrop-blur-[5px]",
          // Closed state (default)
          "opacity-0 invisible",
          "transition-[opacity,visibility] duration-[400ms] ease-[var(--ease)]",
          // Open state
          "data-[state=open]:opacity-100 data-[state=open]:visible"
        )}
      />

      {/* Sidebar panel */}
      <aside
        id="sidebar"
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[150] w-full h-full",
          "flex flex-col",
          "px-[var(--gutter)] pt-[18px] pb-[calc(30px+env(safe-area-inset-bottom))]",
          "bg-[rgba(6,6,12,0.985)] backdrop-blur-[26px]",
          // Closed state (default)
          "opacity-0 invisible",
          "transition-[opacity,visibility] duration-[400ms] ease-[var(--ease)]",
          // Open state
          "data-[state=open]:opacity-100 data-[state=open]:visible",
          // Desktop: hidden at 941px+
          "lg:hidden"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between min-h-[50px] mb-[26px]">
          <a className="brand" href="#top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mk" src="/tasmil-logo.png" alt="" width="28" height="28" />
            <span className="brand-name">Tasmil Finance</span>
          </a>
          <button
            id="sbClose"
            type="button"
            aria-label="Close menu"
            className={cn(
              "w-[42px] h-[42px] flex-none",
              "border border-[var(--line-2)] rounded-xl",
              "bg-white/[0.04] text-[var(--text)]",
              "text-[24px] leading-none cursor-pointer",
              "grid place-items-center",
              "transition-[background] duration-[250ms]",
              "hover:bg-white/[0.09]"
            )}
          >
            ×
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col flex-1">
          {/* Link 1 */}
          <a
            className={cn(
              "flex items-center justify-between gap-4",
              "text-[clamp(16px,4.5vw,20px)] font-semibold tracking-[-0.02em] text-[var(--text)]",
              "py-[clamp(12px,2.5vw,16px)] px-[2px]",
              "border-b border-[var(--line)]",
              // Closed: hidden
              "opacity-0 translate-y-4",
              "transition-[opacity,transform,color] duration-[550ms] ease-[var(--ease)]",
              // Open: revealed with stagger
              "[aside[data-state=open]_&]:opacity-100 [aside[data-state=open]_&]:translate-y-0",
              "[aside[data-state=open]_&]:[transition-delay:100ms]",
              "active:text-[var(--accent)]"
            )}
            href="#features"
          >
            How it works{" "}
            <span
              className={cn(
                "text-[0.58em] text-[var(--accent)] opacity-65",
                "transition-transform duration-300 ease-[var(--ease)]",
                "active:translate-x-[5px]"
              )}
            >
              →
            </span>
          </a>

          {/* Link 2 */}
          <a
            className={cn(
              "flex items-center justify-between gap-4",
              "text-[clamp(16px,4.5vw,20px)] font-semibold tracking-[-0.02em] text-[var(--text)]",
              "py-[clamp(12px,2.5vw,16px)] px-[2px]",
              "border-b border-[var(--line)]",
              "opacity-0 translate-y-4",
              "transition-[opacity,transform,color] duration-[550ms] ease-[var(--ease)]",
              "[aside[data-state=open]_&]:opacity-100 [aside[data-state=open]_&]:translate-y-0",
              "[aside[data-state=open]_&]:[transition-delay:160ms]",
              "active:text-[var(--accent)]"
            )}
            href="#converge"
          >
            One vault{" "}
            <span
              className={cn(
                "text-[0.58em] text-[var(--accent)] opacity-65",
                "transition-transform duration-300 ease-[var(--ease)]"
              )}
            >
              →
            </span>
          </a>

          {/* Link 3 */}
          <a
            className={cn(
              "flex items-center justify-between gap-4",
              "text-[clamp(16px,4.5vw,20px)] font-semibold tracking-[-0.02em] text-[var(--text)]",
              "py-[clamp(12px,2.5vw,16px)] px-[2px]",
              "border-b border-[var(--line)]",
              "opacity-0 translate-y-4",
              "transition-[opacity,transform,color] duration-[550ms] ease-[var(--ease)]",
              "[aside[data-state=open]_&]:opacity-100 [aside[data-state=open]_&]:translate-y-0",
              "[aside[data-state=open]_&]:[transition-delay:220ms]",
              "active:text-[var(--accent)]"
            )}
            href="#security"
          >
            Security{" "}
            <span
              className={cn(
                "text-[0.58em] text-[var(--accent)] opacity-65",
                "transition-transform duration-300 ease-[var(--ease)]"
              )}
            >
              →
            </span>
          </a>

          {/* Link 4 */}
          <a
            className={cn(
              "flex items-center justify-between gap-4",
              "text-[clamp(16px,4.5vw,20px)] font-semibold tracking-[-0.02em] text-[var(--text)]",
              "py-[clamp(12px,2.5vw,16px)] px-[2px]",
              "border-b border-[var(--line)]",
              "opacity-0 translate-y-4",
              "transition-[opacity,transform,color] duration-[550ms] ease-[var(--ease)]",
              "[aside[data-state=open]_&]:opacity-100 [aside[data-state=open]_&]:translate-y-0",
              "[aside[data-state=open]_&]:[transition-delay:280ms]",
              "active:text-[var(--accent)]"
            )}
            href="#fees"
          >
            Fees{" "}
            <span
              className={cn(
                "text-[0.58em] text-[var(--accent)] opacity-65",
                "transition-transform duration-300 ease-[var(--ease)]"
              )}
            >
              →
            </span>
          </a>

          {/* Link 5 */}
          <a
            className={cn(
              "flex items-center justify-between gap-4",
              "text-[clamp(16px,4.5vw,20px)] font-semibold tracking-[-0.02em] text-[var(--text)]",
              "py-[clamp(12px,2.5vw,16px)] px-[2px]",
              "border-b border-[var(--line)]",
              "opacity-0 translate-y-4",
              "transition-[opacity,transform,color] duration-[550ms] ease-[var(--ease)]",
              "[aside[data-state=open]_&]:opacity-100 [aside[data-state=open]_&]:translate-y-0",
              "[aside[data-state=open]_&]:[transition-delay:340ms]",
              "active:text-[var(--accent)]"
            )}
            href="#faq"
          >
            FAQ{" "}
            <span
              className={cn(
                "text-[0.58em] text-[var(--accent)] opacity-65",
                "transition-transform duration-300 ease-[var(--ease)]"
              )}
            >
              →
            </span>
          </a>
        </nav>

        {/* CTA button */}
        <div
          className={cn(
            "mt-[22px]",
            "opacity-0 translate-y-4",
            "transition-[opacity,transform] duration-[550ms] ease-[var(--ease)] [transition-delay:400ms]",
            "[aside[data-state=open]_&]:opacity-100 [aside[data-state=open]_&]:translate-y-0"
          )}
        >
          <Button
            asChild
            variant="gradient"
            className="w-full justify-center text-[16px] py-[17px] px-[34px] h-auto"
          >
            <a href="/waitlist">
              Join Waitlist <span className="arr">→</span>
            </a>
          </Button>
        </div>
      </aside>
    </>
  );
}
