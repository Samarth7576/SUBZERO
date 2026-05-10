import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { buildGmailAuthUrl } from "../../../../lib/gmail/client";

const STATE_COOKIE = "ledger_gmail_oauth_state";

export async function GET(request: Request) {
  console.log("Trace: /api/gmail/connect started");
  try {
    await requireCurrentUser();

    if (process.env.MOCK_MODE === "true") {
      const redirectUrl = new URL(`/api/gmail/callback?code=mock_code&state=mock_state`, request.url);
      console.log("Trace: Mock redirect to", redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }

    const state = crypto.randomUUID();
    const response = NextResponse.redirect(buildGmailAuthUrl(state));
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    console.error("Connection Error:", error);
    return NextResponse.json({ 
      error: "Failed to initiate Gmail connection", 
      message: error.message 
    }, { status: 500 });
  }
}
