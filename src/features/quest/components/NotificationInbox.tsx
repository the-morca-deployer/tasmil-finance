"use client";

import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { useNotificationsControllerList } from "@/gen-quest";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { $ } from "../lib/kubb-config";
import { useQuestAuthStore } from "../store/use-quest-auth";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  isRead?: boolean;
  createdAt: string;
}

interface NotificationListShape {
  items?: NotificationRow[];
  total?: number;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function NotificationInbox() {
  const { isAuthenticated } = useQuestAuthStore();
  const [limit, setLimit] = useState(20);

  const opts = useMemo(
    () => ({ ...$, query: { ...$.query, enabled: isAuthenticated } }),
    [isAuthenticated]
  );
  const { data, isLoading } = useNotificationsControllerList({ page: 1, limit }, opts as never);

  const parsed =
    (data as { data?: NotificationListShape } | NotificationListShape | undefined) ?? {};
  const shape =
    (parsed as { data?: NotificationListShape }).data ?? (parsed as NotificationListShape);
  const items = shape.items ?? [];
  const total = shape.total ?? items.length;

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex h-10 w-10 items-center justify-center rounded-quest-pill border border-[var(--line-2)] bg-[var(--surface)] text-[var(--text)] outline-none transition-colors hover:bg-white/[0.05]"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(360px,calc(100vw-24px))] border-quest-line-2 bg-quest-surface p-0 text-quest-text"
      >
        <div className="border-quest-line-2 border-b px-3 py-2.5 font-semibold text-[13px]">
          Notifications
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-6 text-center text-[13px] text-quest-muted">Loading</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-quest-muted">
              You have no notifications yet
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`border-quest-line-2 border-b px-3 py-2.5 last:border-b-0 ${
                  n.isRead ? "" : "bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[13px]">{n.title}</span>
                  <span className="flex-none text-[11px] text-quest-muted">
                    {relativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-quest-muted leading-snug">{n.body}</p>
              </div>
            ))
          )}
        </div>
        {items.length < total && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + 20)}
            className="w-full border-quest-line-2 border-t px-3 py-2.5 text-center text-[12.5px] text-quest-accent outline-none hover:bg-white/[0.04]"
          >
            Load more
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
