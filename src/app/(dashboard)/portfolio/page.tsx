import { PortfolioPage } from "@/features/portfolio/components/portfolio-page";
import { type CreditPackage, fetchCreditPackages } from "@/features/topup";

export const dynamic = "force-dynamic";

export default async function PortfolioRoute() {
  let packages: CreditPackage[] = [];
  try {
    packages = await fetchCreditPackages();
  } catch (e) {
    console.error("portfolio: fetchCreditPackages failed, rendering with empty list", e);
  }
  return <PortfolioPage packages={packages} />;
}
