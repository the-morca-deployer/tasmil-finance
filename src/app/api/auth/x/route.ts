/**
 * X OAuth - Start Authorization (OAuth 2.0 PKCE)
 *
 * Redirects user to X's authorization page.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64url");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("base64url");
}

export async function GET() {
  const clientId = process.env.X_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/x`;

  // Generate PKCE codes
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Generate random CSRF state
  const stateArray = new Uint8Array(16);
  crypto.getRandomValues(stateArray);
  const state = Buffer.from(stateArray).toString("base64url");

  // Store code verifier and state in cookies for callback
  const cookieStore = await cookies();
  cookieStore.set("x_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });
  cookieStore.set("x_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  // Build authorization URL
  const url = new URL("https://x.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "tweet.read users.read follows.read offline.access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(url);
}
