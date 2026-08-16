"use client";

import { useAdminSettings, useUpdateWaitlistMode } from "@/features/admin/hooks/use-admin-settings";
import { Button } from "@/shared/ui/button";

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateWaitlistMode();
  const waitlistMode = data?.waitlistMode ?? false;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">Settings</h1>
        <p className="text-muted-foreground text-sm">Platform-wide configuration.</p>
      </div>

      <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-card p-5">
        <div className="space-y-1">
          <div className="font-medium">Waitlist mode</div>
          <p className="max-w-md text-muted-foreground text-sm">
            When on, a wallet must have redeemed an access code to sign in. When off, any wallet can
            connect and use the app directly. Default: off.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className={
              waitlistMode ? "font-medium text-sm text-foreground" : "text-muted-foreground text-sm"
            }
          >
            {isLoading ? "..." : waitlistMode ? "On" : "Off"}
          </span>
          <Button
            variant={waitlistMode ? "outline" : "gradient"}
            disabled={isLoading || update.isPending}
            onClick={() => update.mutate(!waitlistMode)}
          >
            {update.isPending ? "Saving..." : waitlistMode ? "Turn off" : "Turn on"}
          </Button>
        </div>
      </div>
    </div>
  );
}
