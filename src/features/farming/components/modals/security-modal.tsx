"use client";

import { Info, Loader2, Shield, ShieldOff } from "lucide-react";
import { Button } from "@/shared/ui/button-v2";

interface SecurityModalProps {
  onRefresh: () => void;
  onRevoke: () => void;
  isPending: boolean;
}

export function SecurityModal({ onRefresh, onRevoke, isPending }: SecurityModalProps) {
  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-xs">
          <p className="font-medium text-foreground">Refresh Session Key</p>
          <p className="text-muted-foreground">
            Re-sign the session-key policy if the bot reports "not authorized" after a strategy
            upgrade. Safe to run anytime — it replaces the current policy with one scoped to the
            latest deployed strategies.
          </p>
        </div>
      </div>
      <Button
        variant="gradient"
        size="lg"
        className="h-12 w-full"
        onClick={onRefresh}
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Shield className="mr-2 h-4 w-4" />
        Refresh Session Key
      </Button>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/10 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="text-xs">
          <p className="font-medium text-foreground">Revoke stops bot automation.</p>
          <p className="text-muted-foreground">
            You can still deposit and withdraw. Activate a new session key any time to resume.
          </p>
        </div>
      </div>
      <Button
        variant="destructive"
        size="lg"
        className="h-12 w-full"
        onClick={onRevoke}
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <ShieldOff className="mr-2 h-4 w-4" />
        Revoke Session Key
      </Button>
    </div>
  );
}
