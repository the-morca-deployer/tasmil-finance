import { render } from "@testing-library/react";
import type { PositionData } from "@/features/account/types";
import { OverviewTab } from "./overview-tab";

const position = {
  totalValueUsd: 100,
  positions: [],
  status: "ACTIVE",
  preset: "BALANCED",
  baseAsset: "USDC",
  activeAssets: ["USDC"],
} as unknown as PositionData;

describe("OverviewTab", () => {
  it("does not render Pools table heading", () => {
    const { queryByRole } = render(
      <OverviewTab
        position={position}
        activities={[]}
        activitiesLoading={false}
        unallocatedWalletUsd={0}
        isRevoked={false}
        accountActionPending={false}
        onActivate={() => {}}
        onSeeAllActivity={() => {}}
      />
    );
    expect(queryByRole("heading", { name: /pools/i, level: 2 })).toBeNull();
  });
});
