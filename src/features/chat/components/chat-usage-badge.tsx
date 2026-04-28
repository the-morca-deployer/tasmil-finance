import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ChatUsageView } from "../hooks/use-chat-usage";

interface Props {
  data: ChatUsageView | undefined;
}

export function ChatUsageBadge({ data }: Props) {
  if (!data) return null;

  if (data.bothExhausted) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <span>You have used all available AI responses for today.</span>
        <Link
          href="/topup"
          className="rounded-md bg-primary px-3 py-1 text-primary-foreground"
          aria-label="Topup credits"
        >
          Topup
        </Link>
      </div>
    );
  }

  const dailyActive = data.daily.remaining > 0;
  const creditActive =
    !dailyActive && data.credits.balance - data.credits.pending > 0;

  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
      <span className={cn(dailyActive && "active font-medium text-foreground")}>
        <span>
          {data.daily.remaining}/{data.daily.max} daily
        </span>
      </span>
      <span aria-hidden>•</span>
      <span className={cn(creditActive && "active font-medium text-foreground")}>
        <span>{data.credits.balance} credits</span>
      </span>
    </div>
  );
}
