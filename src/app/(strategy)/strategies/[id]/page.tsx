import { StrategyDetailPage } from "@/features/strategies";

export default async function StrategyDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StrategyDetailPage strategyId={id} />;
}
