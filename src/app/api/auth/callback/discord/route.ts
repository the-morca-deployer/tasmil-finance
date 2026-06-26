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

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("discord_oauth_state")?.value;
  cookieStore.delete("discord_oauth_state");

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${APP_URL}/profile?oauth_error=invalid_state`);
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/discord`,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Discord token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/profile?oauth_error=token_failed`);
    }

    const { access_token } = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${APP_URL}/profile?oauth_error=user_fetch_failed`);
    }

    const user = await userRes.json();

    const params = new URLSearchParams({
      oauth_platform: "Discord",
      oauth_userId: user.id,
      oauth_username: user.username,
      oauth_displayName: user.global_name || user.username,
    });

    return NextResponse.redirect(`${APP_URL}/profile?${params.toString()}`);
  } catch (error) {
    console.error("Discord auth error:", error);
    return NextResponse.redirect(`${APP_URL}/profile?oauth_error=server_error`);
  }
}
