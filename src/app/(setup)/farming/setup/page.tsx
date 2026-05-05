import { Suspense } from "react";
import { SetupPage } from "@/features/farming/components/setup/setup-page";

export const dynamic = "force-dynamic";

export default function FarmingSetupRoute() {
  return (
    <Suspense fallback={null}>
      <SetupPage />
    </Suspense>
  );
}
