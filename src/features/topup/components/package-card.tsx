import { ArrowRight, Coins, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card";
import type { CreditPackage } from "../types";

const PACKAGE_TITLE: Record<string, string> = {
  starter: "Starter",
  plus: "Plus",
  pro: "Pro",
  whale: "Whale",
};

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
    <Card
      data-testid={`package-card-${pkg.id}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border-border transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_hsl(203_100%_73%/0.25)]",
        recommended && "border-primary/40 shadow-[0_4px_24px_-12px_hsl(203_100%_73%/0.35)]"
      )}
    >
      {/* Recommended ribbon — only on Pro */}
      {recommended && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />
      )}

      <CardHeader className="space-y-4 p-5 pb-3">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-foreground">{title}</span>
            {recommended && (
              <span className="inline-flex h-5 items-center rounded-full border border-primary/30 bg-primary/10 px-2 font-mono font-semibold text-[9px] text-primary uppercase tracking-[0.12em]">
                Recommended
              </span>
            )}
          </div>
          {hasBonus ? (
            <span
              data-testid={`package-card-${pkg.id}-bonus`}
              className="font-mono font-semibold text-[11px] text-primary tabular-nums"
            >
              +{pkg.bonusPercent}%
            </span>
          ) : null}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span
            data-testid={`package-card-${pkg.id}-usd`}
            className="font-bold text-4xl text-foreground tracking-tight tabular-nums"
          >
            {formatUsd(pkg.usd)}
          </span>
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            USD
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-5 pt-0 pb-4">
        <div className="rounded-md border border-border/60 bg-muted/20">
          <div
            className="flex items-center justify-between border-border/60 border-b px-3 py-2.5"
            data-testid={`package-card-${pkg.id}-credits`}
          >
            <span className="inline-flex items-center gap-2 text-muted-foreground text-xs">
              <Coins className="h-3.5 w-3.5" />
              Credits
            </span>
            <span className="font-mono font-semibold text-foreground text-sm tabular-nums">
              {formatNumber(pkg.credits)}
            </span>
          </div>
          <div
            className="flex items-center justify-between px-3 py-2.5"
            data-testid={`package-card-${pkg.id}-points`}
          >
            <span className="inline-flex items-center gap-2 text-muted-foreground text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Points
            </span>
            <span className="font-mono font-semibold text-foreground text-sm tabular-nums">
              {formatNumber(pkg.points)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-5 pt-0">
        <Link
          href={cryptoHref}
          data-testid={`package-card-${pkg.id}-buy-crypto`}
          className={cn(
            "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md font-semibold text-sm transition-all active:scale-[0.98]",
            recommended
              ? "bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF]"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          Buy with crypto
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={fiatHref}
          data-testid={`package-card-${pkg.id}-buy-fiat`}
          className="inline-flex h-6 w-full items-center justify-center text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Pay with bank transfer
        </Link>
      </CardFooter>
    </Card>
  );
}
