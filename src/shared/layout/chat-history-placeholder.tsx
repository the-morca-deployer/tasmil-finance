"use client";

import { MessageSquare } from "lucide-react";

export function ChatHistoryPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 font-semibold text-lg">Chat History</h3>
      <p className="text-muted-foreground text-sm">
        Chat history will be available in a future update.
      </p>
    </div>
  );
}
