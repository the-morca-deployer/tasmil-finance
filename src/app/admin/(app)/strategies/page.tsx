"use client";

import { ActivityTab, OverviewTab, StrategiesTab } from "@/features/admin-strategies";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export default function AdminStrategiesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Strategy Marketplace</h1>
      <Tabs defaultValue="strategies">
        <TabsList>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="tvl">Deposits & TVL</TabsTrigger>
          <TabsTrigger value="activity">Users & Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="strategies">
          <StrategiesTab />
        </TabsContent>
        <TabsContent value="tvl">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
