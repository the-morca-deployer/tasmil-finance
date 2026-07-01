import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const BRAND_GRADIENT = "linear-gradient(100deg,#fff 0%,#67e8f9 100%)";

const SIZES = {
  // Compact utility nav bars (main app top nav)
  md: { logo: 32, text: "text-xl", gap: "gap-2.5", tracking: "tracking-normal" },
  // Narrow mobile drawers
  sm: { logo: 28, text: "text-base", gap: "gap-2.5", tracking: "tracking-normal" },
  // Spacious hero-style headers/footers (quest)
  lg: { logo: 48, text: "text-[30px]", gap: "gap-[15px]", tracking: "tracking-[-0.03em]" },
} as const;

interface BrandLogoProps {
  href: string;
  logoSrc: string;
  text: string;
  alt?: string;
  size?: keyof typeof SIZES;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function BrandLogo({
  href,
  logoSrc,
  text,
  alt,
  size = "md",
  trailing,
  onClick,
  className,
}: BrandLogoProps) {
  const { logo, text: textClass, gap, tracking } = SIZES[size];

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("flex min-w-0 items-center font-bold no-underline", gap, tracking, className)}
    >
      <Image src={logoSrc} width={logo} height={logo} alt={alt ?? text} className="flex-none" />
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn("truncate", textClass)}
          style={{
            background: BRAND_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {text}
        </span>
        {trailing}
      </span>
    </Link>
  );
}
