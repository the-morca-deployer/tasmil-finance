"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface MegaMenuItem {
  label: string;
  description: string;
  href: string;
}

const ITEMS: MegaMenuItem[] = [
  {
    label: "Marketplace",
    description: "Browse all available strategies",
    href: "/strategies",
  },
  {
    label: "Publisher Dashboard",
    description: "Track your published strategies",
    href: "/strategies/dashboard",
  },
  {
    label: "Leaderboard",
    description: "Top performing strategies",
    href: "/strategies/leaderboard",
  },
  {
    label: "Publish Strategy",
    description: "Create and deploy your own strategy",
    href: "/strategies/create",
  },
];

export function MegaMenu({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const panelRef = useRef<HTMLDivElement>(null);
  const [escaped, setEscaped] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setEscaped(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute left-0 top-full z-50 mt-2 w-[280px] rounded-[22px] border p-2",
        "border-[rgba(255,255,255,0.08)] bg-[#0D111A] shadow-xl",
        "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
        "translate-y-2 group-hover:translate-y-0 transition-all duration-200",
        escaped && "opacity-0 invisible translate-y-2",
        className
      )}
      role="menu"
      aria-label="Strategies menu"
      onMouseEnter={() => setEscaped(false)}
    >
      {ITEMS.map((item) => {
        const isActive =
          item.href === "/strategies" ? pathname === "/strategies" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            role="menuitem"
            className={cn(
              "block rounded-[14px] px-5 py-3 transition-colors",
              isActive ? "bg-[rgba(103,232,249,0.14)]" : "hover:bg-[rgba(255,255,255,0.05)]"
            )}
          >
            <div
              className={cn(
                "font-medium text-[14.5px]",
                isActive ? "text-[#67E8F9]" : "text-[#F4F7FB]"
              )}
            >
              {item.label}
            </div>
            <div className="mt-0.5 text-[12px] text-[rgba(244,247,251,0.34)]">
              {item.description}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
