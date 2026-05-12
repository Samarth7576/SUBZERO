import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { buildGmailAuthUrl } from "../../../../lib/gmail/client";

function signState(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const sig = createHmac("sha256", process.env.AUTH_SECRET!).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export async function GET(request: Request) {
  console.log("Trace: /api/gmail/connect started");
  try {
    const user = await requireCurrentUser();

    if (process.env.MOCK_MODE === "true") {
      const redirectUrl = new URL(`/api/gmail/callback?code=mock_code&state=mock_state`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    const state = signState(user.id);
    return NextResponse.redirect(buildGmailAuthUrl(state));
  } catch (error: any) {
    console.error("Connection Error:", error);
    return NextResponse.json({
      error: "Failed to initiate Gmail connection",
      message: error.message,
    }, { status: 500 });
  }
}
