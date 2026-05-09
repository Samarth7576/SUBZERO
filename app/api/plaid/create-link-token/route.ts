import { NextResponse } from "next/server";
import { plaidClient } from "../../../../lib/plaid/client";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { CountryCode, Products } from "plaid";

export async function POST() {
  try {
    const user = await requireCurrentUser();

    // If we are missing real keys, return a fake link token so the UI doesn't crash
    if (process.env.PLAID_CLIENT_ID === undefined) {
      return NextResponse.json({ link_token: "link-sandbox-mock-12345" });
    }

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: 'Ledger',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb, CountryCode.Fr, CountryCode.Ie],
      language: 'en',
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating Plaid link token:", error);
    return NextResponse.json({ error: "Failed to create link token" }, { status: 500 });
  }
}
