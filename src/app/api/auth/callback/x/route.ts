import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tasmil.finance";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/profile?oauth_error=cancelled`);
  }

  try {
    const cookieStore = await cookies();
    const expectedState = cookieStore.get("x_oauth_state")?.value;
    cookieStore.delete("x_oauth_state");

    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(`${APP_URL}/profile?oauth_error=invalid_state`);
    }

    const codeVerifier = cookieStore.get("x_code_verifier")?.value;
    cookieStore.delete("x_code_verifier");

    if (!codeVerifier) {
      return NextResponse.redirect(`${APP_URL}/profile?oauth_error=session_expired`);
    }

    const basicAuth = Buffer.from(
      `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/x`,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      console.error("X token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/profile?oauth_error=token_failed`);
    }

    const { access_token } = await tokenRes.json();

    const userRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${APP_URL}/profile?oauth_error=user_fetch_failed`);
    }

    const { data: user } = await userRes.json();

    const params = new URLSearchParams({
      oauth_platform: "X",
      oauth_userId: user.id,
      oauth_username: user.username,
      oauth_displayName: user.name ?? "",
    });

    return NextResponse.redirect(`${APP_URL}/profile?${params.toString()}`);
  } catch (error) {
    console.error("X auth error:", error);
    return NextResponse.redirect(`${APP_URL}/profile?oauth_error=server_error`);
  }
}
