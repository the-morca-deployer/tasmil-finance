"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./sidebar-data";

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);

  const isExternal = item.url.startsWith("http");

  return (
    <Link
      href={item.url}
      data-active={isActive ? "true" : "false"}
      className={cn(
        "relative rounded-quest-pill px-4 py-[9px] text-[15px] transition-[color,background] duration-[250ms]",
        isActive
          ? "text-foreground after:absolute after:right-[15px] after:bottom-[1px] after:left-[15px] after:h-[2px] after:rounded-[2px] after:bg-quest-accent after:shadow-[0_0_10px_var(--color-quest-accent-glow)] after:content-['']"
          : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
      )}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {item.title}
    </Link>
  );
}
