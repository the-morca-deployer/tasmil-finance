import { APP_ENTRY, isWaitlistMode } from "@/lib/waitlist-mode";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

export default function Nav() {
  const waitlist = isWaitlistMode();
  return (
    <nav
      id="nav"
      className={cn(
        // Base layout
        "fixed inset-x-0 top-0 z-[100] flex items-center justify-between",
        "px-[var(--gutter)] py-[18px]",
        // Base visual
        "bg-black/35 backdrop-blur-[18px] [backdrop-filter:blur(18px)_saturate(140%)]",
        "border-b border-transparent",
        "transition-[background,border-color,padding] duration-500 ease-[var(--ease)]",
        // Scrolled state
        "data-[scrolled=true]:bg-[rgba(8,7,13,0.72)]",
        "data-[scrolled=true]:border-b-[var(--line)]",
        "data-[scrolled=true]:py-[12px]"
      )}
    >
      {/* Brand */}
      <a className="brand" href="#top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mk" src="/tasmil-logo.png" alt="Tasmil Finance" width="40" height="40" />
        <span className="brand-name">Tasmil Finance</span>
      </a>

      {/* Center nav links — hidden below 940px */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 hidden lg:flex",
          "items-center gap-0.5"
        )}
      >
        <a
          className={cn(
            "text-[15px] font-medium text-[var(--muted)] px-4 py-[9px] rounded-full",
            "transition-[color,background] duration-300",
            "hover:text-[var(--text)] hover:bg-white/5"
          )}
          href="#features"
        >
          How it works
        </a>
        <a
          className={cn(
            "text-[15px] font-medium text-[var(--muted)] px-4 py-[9px] rounded-full",
            "transition-[color,background] duration-300",
            "hover:text-[var(--text)] hover:bg-white/5"
          )}
          href="#features"
        >
          Product
        </a>
        <a
          className={cn(
            "text-[15px] font-medium text-[var(--muted)] px-4 py-[9px] rounded-full",
            "transition-[color,background] duration-300",
            "hover:text-[var(--text)] hover:bg-white/5"
          )}
          href="#security"
        >
          Security
        </a>
        <a
          className={cn(
            "text-[15px] font-medium text-[var(--muted)] px-4 py-[9px] rounded-full",
            "transition-[color,background] duration-300",
            "hover:text-[var(--text)] hover:bg-white/5"
          )}
          href="#fees"
        >
          Fees
        </a>
      </div>

      {/* Nav actions — hidden on mobile (max-940px) */}
      <div className="hidden lg:flex items-center gap-[10px]">
        {waitlist ? (
          <>
            <Button asChild variant="ghost" className="py-[11px] px-[18px] text-[14px] h-auto">
              <a href="/access">Have a code?</a>
            </Button>
            <Button asChild variant="gradient" className="py-[11px] px-[22px] text-[14px] h-auto">
              <a href="/waitlist">
                Join Waitlist <span className="arr">→</span>
              </a>
            </Button>
          </>
        ) : (
          <Button asChild variant="gradient" className="py-[11px] px-[22px] text-[14px] h-auto">
            <a href={APP_ENTRY}>
              Launch App <span className="arr">→</span>
            </a>
          </Button>
        )}
      </div>

      {/* Burger — visible on mobile (max-940px) */}
      <button
        id="navBurger"
        type="button"
        aria-label="Open menu"
        aria-expanded="false"
        className={cn(
          "flex lg:hidden flex-col items-center justify-center gap-[5px]",
          "w-11 h-11 border border-[var(--line-2)] rounded-xl",
          "bg-white/[0.04] backdrop-blur-[8px] cursor-pointer p-0"
        )}
      >
        {/* Bar 1 */}
        <span
          className={cn(
            "block w-[18px] h-[2px] rounded-[2px] bg-[var(--text)]",
            "transition-transform duration-[350ms] ease-[var(--ease)]",
            "data-[state=open]:translate-y-[7px] data-[state=open]:rotate-45",
            "[button[data-state=open]_&]:translate-y-[7px]",
            "[button[data-state=open]_&]:rotate-45"
          )}
        />
        {/* Bar 2 */}
        <span
          className={cn(
            "block w-[18px] h-[2px] rounded-[2px] bg-[var(--text)]",
            "transition-opacity duration-[250ms]",
            "[button[data-state=open]_&]:opacity-0"
          )}
        />
        {/* Bar 3 */}
        <span
          className={cn(
            "block w-[18px] h-[2px] rounded-[2px] bg-[var(--text)]",
            "transition-transform duration-[350ms] ease-[var(--ease)]",
            "[button[data-state=open]_&]:-translate-y-[7px]",
            "[button[data-state=open]_&]:-rotate-45"
          )}
        />
      </button>
    </nav>
  );
}
