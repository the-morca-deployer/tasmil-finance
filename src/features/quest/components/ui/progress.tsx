import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-quest-pill bg-quest-line", className)}
    >
      <div
        data-testid="quest-progress-fill"
        className="h-full rounded-quest-pill transition-[width] duration-700 ease-quest"
        style={{ width: `${pct}%`, background: "var(--quest-grad)" }}
      />
    </div>
  );
}
