"use client";

import { Button } from "@/shared/ui/button";

export interface DateRangeValue {
  from: string;
  to: string;
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ from: isoDaysAgo(preset.days), to: isoDaysAgo(0) })}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1" htmlFor="analytics-from">
          From
          <input
            id="analytics-from"
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-1" htmlFor="analytics-to">
          To
          <input
            id="analytics-to"
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1"
          />
        </label>
      </div>
    </div>
  );
}
