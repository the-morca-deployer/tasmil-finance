"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  BLEND: "#8b5cf6",
  SOROSWAP: "#06b6d4",
  AQUARIUS: "#10b981",
  PHOENIX: "#f59e0b",
};

interface AllocationEntry {
  poolName: string;
  protocol: string;
  allocationPercent: number;
}

interface AllocationPieChartProps {
  allocations: AllocationEntry[];
}

export function AllocationPieChart({ allocations }: AllocationPieChartProps) {
  const data = allocations.map((a) => ({
    name: a.poolName,
    value: a.allocationPercent,
    protocol: a.protocol,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {data.map((d, i) => (
            <Cell key={i} fill={COLORS[d.protocol] ?? "#71717a"} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
