import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { buildGmailAuthUrl } from "../../../../lib/gmail/client";

const STATE_COOKIE = "ledger_gmail_oauth_state";

export async function GET(request: Request) {
  console.log("Trace: /api/gmail/connect started");
  try {
    const user = await requireCurrentUser();
    const state = "mock_state";
    
    if (process.env.MOCK_MODE === "true") {
      const redirectUrl = new URL(`/api/gmail/callback?code=mock_code&state=${state}`, request.url);
      console.log("Trace: Mock redirect to", redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }

    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.redirect(buildGmailAuthUrl(state));
  } catch (error: any) {
    console.error("Connection Error:", error);
    return NextResponse.json({ 
      error: "Failed to initiate Gmail connection", 
      message: error.message 
    }, { status: 500 });
  }
}
