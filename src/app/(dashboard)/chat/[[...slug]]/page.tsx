"use client";

import { useParams } from "next/navigation";
import { ChatPageWrapper } from "@/features/chat/components/chat-page-wrapper";

/**
 * Optional catch-all route for the one-chat-interface.
 *
 * URL patterns:
 *   /chat/new                          → new chat with default supervisor agent
 *   /chat/<threadId>                   → existing chat thread with supervisor
 *   /chat/<agentId>/<threadId>         → backwards-compatible agent-specific chat
 *   /chat/<agentId>/new                → backwards-compatible new agent-specific chat
 */
export default function ChatPage() {
  const { slug } = useParams<{ slug?: string[] }>();

  const slugArray = slug ?? [];
  const slugLen = slugArray.length;

  let agentId: string;
  let chatId: string;

  if (slugLen === 0) {
    // /chat (no slug) → new chat with supervisor
    agentId = "supervisor";
    chatId = "new";
  } else if (slugLen === 1) {
    // /chat/new or /chat/<threadId>
    agentId = "supervisor";
    chatId = slugArray[0] ?? "new";
  } else {
    // /chat/<agentId>/<threadId> (backwards compatible)
    agentId = slugArray[0] ?? "supervisor";
    chatId = slugArray[1] ?? "new";
  }

  return <ChatPageWrapper agentId={agentId} chatId={chatId} />;
}
