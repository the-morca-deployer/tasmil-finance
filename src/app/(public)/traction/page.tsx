import type { Metadata } from "next";
import Link from "next/link";
import { TractionDashboard } from "@/features/traction";
import { FeePage } from "@/features/transparency/components/fee-page";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tasmil - Traction",
  description: "Live growth metrics, fees and policy rejections for Tasmil Finance",
  robots: { index: false, follow: false },
};

// Public, protocol-wide SOW2 evidence: traction (Deliverable 5) and every fee
// event plus policy rejection (Deliverable 2), each on its own linkable tab.
const TABS = [
  { id: "traction", label: "Traction", href: "/traction" },
  { id: "fees", label: "Fees & rejections", href: "/traction?tab=fees" },
] as const;

export default async function TractionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const active = (await searchParams).tab === "fees" ? "fees" : "traction";

  return (
    <>
      <nav
        aria-label="Evidence sections"
        className="mx-auto flex w-full max-w-5xl gap-6 border-border border-b px-4 pt-6"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active === tab.id ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-3 font-medium text-sm transition-colors",
              active === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {active === "fees" ? <FeePage /> : <TractionDashboard />}
    </>
  );
}
