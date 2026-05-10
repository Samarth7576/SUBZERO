import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { encryptToken } from "../../../../lib/crypto";
import { prisma } from "../../../../lib/db";
import {
  exchangeGmailCode,
  getGmailProfile,
} from "../../../../lib/gmail/client";

const STATE_COOKIE = "ledger_gmail_oauth_state";

export async function GET(request: NextRequest) {
  console.log("Trace: /api/gmail/callback started");
  try {
    const user = await requireCurrentUser();
    console.log("Trace: User found in callback", user.email);

    if (process.env.MOCK_MODE === "true") {
      // Clear any potential conflicts first
      await prisma.user.deleteMany({ where: { email: user.email } });
      
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    if (process.env.MOCK_MODE === "true" && code === "mock_code") {
       console.log("Trace: Handling mock callback");
    } else {
      const cookieStore = await cookies();
      const expectedState = cookieStore.get(STATE_COOKIE)?.value;
      if (!code) return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
      if (!state) return NextResponse.json({ error: "Missing state parameter" }, { status: 400 });
      if (!expectedState) return NextResponse.json({ error: "Missing state cookie — cookie was not sent" }, { status: 400 });
      if (state !== expectedState) return NextResponse.json({ error: `State mismatch` }, { status: 400 });
    }

    let tokens;
    let profile;

    if (process.env.MOCK_MODE === "true" && code === "mock_code") {
      tokens = { access_token: "mock_access_token", refresh_token: "mock_refresh_token" };
      profile = { emailAddress: "mock-user@example.com", historyId: undefined };
    } else {
      tokens = await exchangeGmailCode(code!);
      profile = await getGmailProfile(tokens.access_token);
    }

    const encryptedAccessToken = await encryptToken(tokens.access_token, user.id);
    const encryptedRefreshToken = tokens.refresh_token
      ? await encryptToken(tokens.refresh_token, user.id)
      : undefined;

    await prisma.sourceAccount.upsert({
      create: {
        identifier: profile.emailAddress,
        kind: "gmail",
        oauth_refresh: encryptedRefreshToken,
        oauth_token: encryptedAccessToken,
        region: "GLOBAL",
        status: "active",
        sync_cursor: profile.historyId ? String(profile.historyId) : undefined,
        user_id: user.id,
      },
      update: {
        oauth_refresh: encryptedRefreshToken,
        oauth_token: encryptedAccessToken,
        status: "active",
        sync_cursor: profile.historyId ? String(profile.historyId) : undefined,
      },
      where: {
        user_id_kind_identifier: {
          identifier: profile.emailAddress,
          kind: "gmail",
          user_id: user.id,
        },
      },
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    const cookieStore = await cookies();
    cookieStore.delete(STATE_COOKIE);

    return response;
  } catch (error) {
    console.error("Trace: Error in callback route", error);
    throw error;
  }
}
