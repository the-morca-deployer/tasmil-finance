import { NextRequest } from "next/server";

const AI_URL = process.env.AI_INTERNAL_URL ?? process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:8001";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${AI_URL}/agui/${path.join("/")}`;

  const body = await req.text();
  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
    Accept: "text/event-stream",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const wallet = req.headers.get("x-chat-wallet-address");
  if (wallet) headers["x-chat-wallet-address"] = wallet;

  const upstream = await fetch(target, {
    method: "POST",
    headers,
    body,
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
