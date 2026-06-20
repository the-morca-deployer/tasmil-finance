/**
 * Telegram Login - Verify and Link Account
 *
 * Telegram Login Widget sends user data via POST.
 * We verify it and link the account via API.
 */

import crypto from "crypto";
import { NextResponse } from "next/server";

async function verifyTelegramAuth(
  initData: string,
  botToken: string
): Promise<{
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
} | null> {
  try {
    // Parse initData from Telegram Login Widget
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const authDate = params.get("auth_date");

    if (!hash || !authDate) {
      return null;
    }

    // Check if auth_date is not too old (24 hours)
    const authDateNum = parseInt(authDate);
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = now - authDateNum;

    if (timeDiff > 86400 || timeDiff < -300) {
      return null;
    }

    // Verify hash according to Telegram documentation
    const decodedParams = new Map<string, string>();
    const pairs = initData.split("&");

    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split("=");
      if (key && key !== "hash") {
        const encodedValue = valueParts.join("=");
        const withSpaces = encodedValue.replace(/\+/g, " ");
        const decodedValue = decodeURIComponent(withSpaces);
        decodedParams.set(key, decodedValue);
      }
    }

    // Sort keys alphabetically and create data check string
    const dataCheckArray = Array.from(decodedParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`);

    const dataCheckString = dataCheckArray.join("\n");

    // Create secret key: SHA256(bot_token)
    const secretKey = crypto.createHash("sha256").update(botToken).digest();

    // Calculate hash: HMAC_SHA256(data_check_string, secret_key)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Verify hash matches
    if (calculatedHash !== hash) {
      return null;
    }

    // Extract user data
    const userId = params.get("id");
    let firstName = params.get("first_name");
    let lastName = params.get("last_name");
    let username = params.get("username");
    let photoUrl = params.get("photo_url");

    // Decode URL-encoded values for user data
    if (firstName) {
      firstName = decodeURIComponent(firstName.replace(/\+/g, " "));
    }
    if (lastName) {
      lastName = decodeURIComponent(lastName.replace(/\+/g, " "));
    }
    if (username) {
      username = decodeURIComponent(username.replace(/\+/g, " "));
    }
    if (photoUrl) {
      photoUrl = decodeURIComponent(photoUrl.replace(/\+/g, " "));
    }

    if (!userId || !firstName) {
      return null;
    }

    return {
      id: userId,
      first_name: firstName,
      last_name: lastName || undefined,
      username: username || undefined,
      photo_url: photoUrl || undefined,
    };
  } catch (error) {
    console.error("Telegram verification error:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { initData } = await req.json();

    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    let botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
    }

    // Trim and validate bot token format
    botToken = botToken.trim();

    if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
      return NextResponse.json({ error: "Invalid TELEGRAM_BOT_TOKEN format" }, { status: 500 });
    }

    // Verify Telegram auth data
    const userData = await verifyTelegramAuth(initData, botToken);

    if (!userData) {
      return NextResponse.json({ error: "Invalid Telegram auth data" }, { status: 401 });
    }

    // Return account data - client will call link-account API
    return NextResponse.json({
      success: true,
      user: userData,
      accountData: {
        platformUserId: userData.id,
        username: userData.username,
        displayName: `${userData.first_name}${userData.last_name ? ` ${userData.last_name}` : ""}`,
        avatarUrl: userData.photo_url,
      },
    });
  } catch (error) {
    console.error("Telegram auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
