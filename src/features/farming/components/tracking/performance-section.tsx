"use client";

import type { HistoryPoint, HistoryRange } from "../../hooks/use-portfolio-history";
import { PerformanceChart } from "../performance-chart";
import { Hairline } from "../shared/hairline";
import { SectionHeader } from "../shared/section-header";

interface Props {
  data: HistoryPoint[] | undefined;
  range: HistoryRange;
  isLoading: boolean;
  isPlaceholder: boolean;
  onRangeChange: (range: HistoryRange) => void;
}

const RANGES: HistoryRange[] = ["7d", "30d", "90d", "all"];

export function PerformanceSection({
  data,
  range,
  isLoading,
  isPlaceholder,
  onRangeChange,
}: Props) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        action={
          <div className="flex gap-1">
            {RANGES.map((r) => {
              const active = r === range;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRangeChange(r)}
                  className={
                    active
                      ? "rounded-full border border-primary px-2 py-0.5 text-[10px] text-primary"
                      : "rounded-full border border-[#2a2a2a] px-2 py-0.5 text-[10px] text-[#888]"
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
        }
      >
        Performance · {range}
      </SectionHeader>
      <Hairline />
      <PerformanceChart
        data={data ?? []}
        range={range}
        isLoading={isLoading}
        isPlaceholder={isPlaceholder}
        onRangeChange={onRangeChange}
      />
    </section>
  );
}
