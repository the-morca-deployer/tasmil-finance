"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ApyDataPoint {
  timestamp: string;
  nav: number;
  hwm: number;
}

interface ApyLineChartProps {
  data: ApyDataPoint[];
  height?: number;
}

export function ApyLineChart({ data, height = 200 }: ApyLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={(v: string) =>
            new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
          }
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => (typeof v === "string" ? new Date(v).toLocaleDateString() : "")}
        />
        <Line type="monotone" dataKey="nav" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
