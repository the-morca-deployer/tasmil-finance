import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The SOW2 audit gate, stated where users and reviewers see it: the vault is a
 * guarded mainnet beta - opt-in, capped on-chain, not yet externally audited.
 */
export const GUARDED_BETA_POINTS = [
  "Opt-in only: you explicitly accept these terms before a vault is created.",
  "Hard caps on-chain: each vault has per-transaction and cumulative limits, and the beta has a total wallet cap.",
  "Not yet externally audited: there is no retail release until an external audit is complete.",
  "You can always withdraw with your own wallet, even if the agent is paused or revoked.",
] as const;

export function GuardedBetaNotice({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  return (
    <aside
      aria-label="Guarded beta"
      className={cn("rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm", className)}
    >
      <p className="flex items-center gap-2 font-medium text-amber-300">
        <FlaskConical className="h-4 w-4 shrink-0" />
        Guarded mainnet beta
      </p>
      {variant === "compact" ? (
        <p className="mt-1 text-muted-foreground">
          Opt-in, capped on-chain and not yet externally audited. No retail release before the
          audit; you can always withdraw.
        </p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          {GUARDED_BETA_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
