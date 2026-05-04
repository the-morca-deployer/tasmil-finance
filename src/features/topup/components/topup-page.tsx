import type { CreditPackage } from "../types";
import { PackageCard } from "./package-card";

interface PackageGridProps {
  packages: CreditPackage[];
}

export function PackageGrid({ packages }: PackageGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="topup-package-grid">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}

interface TopupPageProps {
  packages: CreditPackage[];
}

export function TopupPage({ packages }: TopupPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
      <div className="mb-8 space-y-2">
        <h1 className="font-semibold text-3xl text-foreground" data-testid="topup-page-title">
          Top up your Tasmil credits
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Choose a package below. Pay with crypto (XLM transfer) or with a bank transfer. Credits
          never expire.
        </p>
      </div>

      <PackageGrid packages={packages} />
    </div>
  );
}
