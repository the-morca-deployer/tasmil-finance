/**
 * Discord OAuth - Start Authorization
 *
 * Redirects user to Discord's authorization page.
 * After authorization, Discord redirects to /api/auth/callback/discord
 */

import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/discord`;

  // Generate CSRF state nonce
  const stateNonce = crypto.randomUUID();

  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify guilds");
  url.searchParams.set("state", stateNonce);

  const response = NextResponse.redirect(url);

  // Store state in HttpOnly cookie for verification at callback
  const cookieStore = await cookies();
  cookieStore.set("discord_oauth_state", stateNonce, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return response;
}
