import { TopupWaitPage } from "@/features/topup/components/topup-wait-page";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ topupId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { topupId } = await params;
  return <TopupWaitPage topupId={topupId} />;
}
