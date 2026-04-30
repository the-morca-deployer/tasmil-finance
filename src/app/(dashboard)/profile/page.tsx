import { ProfilePage } from "@/features/profile";
import { fetchCreditPackages, type CreditPackage } from "@/features/topup";

export const dynamic = "force-dynamic";

export default async function Page() {
  let packages: CreditPackage[] = [];
  try {
    packages = await fetchCreditPackages();
  } catch (e) {
    console.error("profile: fetchCreditPackages failed, rendering with empty list", e);
  }
  return <ProfilePage packages={packages} />;
}
