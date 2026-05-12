import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { buildGmailAuthUrl } from "../../../../lib/gmail/client";
import { gmailState } from "../../../../lib/gmail/state";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (process.env.MOCK_MODE === "true") {
      const redirectUrl = new URL(`/api/gmail/callback?code=mock_code&state=mock_state`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    const state = gmailState(user.id);
    return NextResponse.redirect(buildGmailAuthUrl(state));
  } catch (error: any) {
    console.error("Connection Error:", error);
    return NextResponse.json({
      error: "Failed to initiate Gmail connection",
      message: error.message,
    }, { status: 500 });
  }
}
