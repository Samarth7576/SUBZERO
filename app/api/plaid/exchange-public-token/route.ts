import { NextResponse } from "next/server";
import { plaidClient } from "../../../../lib/plaid/client";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { prisma } from "../../../../lib/db";
import { encryptToken } from "../../../../lib/crypto";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const { public_token, institution_name } = body;

    let accessToken = "mock-access-token";
    let itemId = "mock-item-id";

    // If we have real keys, do the real exchange
    if (process.env.PLAID_CLIENT_ID) {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token,
      });
      accessToken = response.data.access_token;
      itemId = response.data.item_id;
    }

    const encryptedAccessToken = await encryptToken(accessToken, user.id);
    const encryptedItemId = await encryptToken(itemId, user.id);

    // Save the connected bank as a new Source Account
    await prisma.sourceAccount.upsert({
      where: {
        user_id_kind_identifier: {
          user_id: user.id,
          kind: "plaid",
          identifier: institution_name || "Bank Account",
        }
      },
      create: {
        user_id: user.id,
        kind: "plaid",
        identifier: institution_name || "Bank Account",
        oauth_token: encryptedAccessToken,
        oauth_refresh: encryptedItemId, // Storing item_id here for reference
        status: "active",
      },
      update: {
        oauth_token: encryptedAccessToken,
        status: "active",
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error exchanging Plaid public token:", error);
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
  }
}
