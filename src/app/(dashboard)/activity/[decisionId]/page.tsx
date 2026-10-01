import { DecisionReplayPage } from "@/features/transparency/components/decision-replay-page";

export default async function Page({ params }: { params: Promise<{ decisionId: string }> }) {
  const { decisionId } = await params;
  return <DecisionReplayPage decisionId={decisionId} />;
}
