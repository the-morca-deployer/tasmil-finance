"use client";

import dynamic from "next/dynamic";

const AggregatorPage = dynamic(
  () =>
    import("@/features/aggregator/components/aggregator-page").then((m) => ({
      default: m.AggregatorPage,
    })),
  { ssr: false },
);

export default function AggregatorRoute() {
  return <AggregatorPage />;
}
