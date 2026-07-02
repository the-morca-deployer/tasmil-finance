"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";
import type { VolumeTvlPoint } from "../types";

export function VolumeTvlChart({
  data,
  isLoading,
}: {
  data: VolumeTvlPoint[] | undefined;
  isLoading: boolean;
}) {
  const points = data ?? [];

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Volume &amp; TVL
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Deposit/withdraw volume and cumulative net-deposit TVL over the selected range
          </Typography>
        </div>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
            Loading…
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
            No volume data in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="volumeUsd"
                name="Volume (USD)"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#volumeGrad)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cumulativeTvlUsd"
                name="Cumulative TVL (USD, est.)"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
