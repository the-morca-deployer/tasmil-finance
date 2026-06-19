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
        "font-medium text-base transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {item.title}
    </Link>
  );
}
