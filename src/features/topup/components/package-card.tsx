import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CreditPackage } from "../types";

const PACKAGE_TITLE: Record<string, string> = {
  starter: "Starter",
  plus: "Plus",
  pro: "Pro",
  whale: "Whale",
};

const ACCENT = "#59C3FF";

interface PackageCardProps {
  pkg: CreditPackage;
}

function formatUsd(n: number): string {
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function PackageCard({ pkg }: PackageCardProps) {
  const title = PACKAGE_TITLE[pkg.id] ?? pkg.id;
  const cryptoHref = `/topup/${pkg.id}/quote/crypto`;
  const fiatHref = `/topup/${pkg.id}/quote/fiat`;
  const hasBonus = pkg.bonusPercent > 0;
  const recommended = pkg.id === "pro";

  return (
    <div
      data-testid={`package-card-${pkg.id}`}
      className={cn(
        "relative flex h-full flex-col rounded-md border bg-[#1a1a1a] transition-colors",
        recommended ? "border-[#59C3FF]/70" : "border-white/[0.06] hover:border-white/[0.12]"
      )}
      style={
        recommended
          ? { boxShadow: `0 0 0 1px ${ACCENT}33, 0 8px 32px -16px ${ACCENT}40` }
          : undefined
      }
    >
      {/* RECOMMENDED ribbon — sits on top edge of Pro card */}
      {recommended && (
        <div className="-top-2.5 -translate-x-1/2 absolute left-1/2 z-10">
          <span className="rounded-sm bg-[#59C3FF] px-2 py-0.5 font-semibold text-[10px] text-black uppercase tracking-[0.14em]">
            Recommended
          </span>
        </div>
      )}

      {/* Header: tier name + bonus chip */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <span className="font-semibold text-[15px] text-white">{title}</span>
        {hasBonus ? (
          <span
            data-testid={`package-card-${pkg.id}-bonus`}
            className="rounded-sm border border-[#262626] px-1.5 py-0.5 font-mono font-semibold text-[10px] text-[#59C3FF] tracking-wider"
          >
            +{pkg.bonusPercent}%
          </span>
        ) : null}
      </div>

      {/* Price — big number, USD small + muted */}
      <div className="px-5 pb-4">
        <div className="flex items-baseline gap-1.5">
          <span
            data-testid={`package-card-${pkg.id}-usd`}
            className="font-bold text-3xl text-white tracking-tight tabular-nums"
          >
            {formatUsd(pkg.usd)}
          </span>
          <span className="text-[#A3A3A3] text-sm">USD</span>
        </div>
      </div>

      {/* Hairline divider before stats */}
      <div className="mx-5 h-px bg-[#262626]" />

      {/* Stats — Credits / Points rows */}
      <div className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        <div
          className="flex items-center justify-between text-sm"
          data-testid={`package-card-${pkg.id}-credits`}
        >
          <span className="text-[#A3A3A3]">Credits</span>
          <span className="font-mono font-medium text-white tabular-nums">
            {formatNumber(pkg.credits)}
          </span>
        </div>
        <div
          className="flex items-center justify-between text-sm"
          data-testid={`package-card-${pkg.id}-points`}
        >
          <span className="text-[#A3A3A3]">Points</span>
          <span className="font-mono font-medium text-white tabular-nums">
            {formatNumber(pkg.points)}
          </span>
        </div>
      </div>

      {/* Hairline divider before action */}
      <div className="mx-5 h-px bg-[#262626]" />

      {/* Action — Pro = solid blue, others = dark gray */}
      <div className="flex flex-col gap-2 p-5">
        <Link
          href={cryptoHref}
          data-testid={`package-card-${pkg.id}-buy-crypto`}
          className={cn(
            "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md font-semibold text-[13px] transition-colors",
            recommended
              ? "bg-[#59C3FF] text-black hover:bg-[#7ad0ff]"
              : "bg-[#262626] text-white hover:bg-[#333333]"
          )}
        >
          Buy with crypto
          {recommended && <ArrowRight className="h-3.5 w-3.5" />}
        </Link>
        <Link
          href={fiatHref}
          data-testid={`package-card-${pkg.id}-buy-fiat`}
          className="self-center text-[#737373] text-xs underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Pay with bank transfer
        </Link>
      </div>
    </div>
  );
}
