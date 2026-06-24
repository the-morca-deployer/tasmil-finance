import { StrategyFooter } from "@/features/strategies/components/StrategyFooter";
import { StrategyNav } from "@/features/strategies/components/StrategyNav";

export default function StrategyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StrategyNav />
      <main>{children}</main>
      <StrategyFooter />
    </>
  );
}
