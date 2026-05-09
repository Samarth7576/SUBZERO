import { prisma } from "../db";
import { plaidClient } from "./client";
import { decryptToken } from "../crypto";
import crypto from "crypto";

export async function syncPlaidSource(sourceId: string) {
  console.log("Trace: Starting Plaid Sync for Source", sourceId);

  const source = await prisma.sourceAccount.findUnique({
    where: { id: sourceId },
  });

  if (!source || !source.oauth_token) {
    throw new Error("Invalid Plaid source account");
  }

  let transactions: any[] = [];

  // If we have a real token and keys, fetch from Plaid API
  if (process.env.PLAID_CLIENT_ID && source.oauth_token !== "mock-access-token") {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Get 1 year of history
    
    try {
      const accessToken = await decryptToken(source.oauth_token, source.user_id);
      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      });
      transactions = response.data.transactions;
    } catch (e) {
      console.error("Plaid Sync Error", e);
      await prisma.sourceAccount.update({
        where: { id: source.id },
        data: { status: "error" }
      });
      throw e;
    }
  } else {
    // Generate Mock Bank Data for testing without keys!
    console.log("Trace: Using mock Plaid transactions");
    transactions = generateMockTransactions();
  }

  // Map Plaid transactions to RawEvents
  let newEvents = 0;
  for (const txn of transactions) {
    // Plaid amounts are positive for purchases, negative for refunds/income.
    // We only care about expenses (positive).
    if (txn.amount <= 0) continue;

    // Plaid usually uses USD as default
    const currency = txn.iso_currency_code || 'USD';
    const amountMinor = BigInt(Math.round(txn.amount * 100));
    
    // Hash the ID so we don't accidentally save the same transaction twice
    const bodyHash = crypto.createHash("sha256").update(txn.transaction_id).digest("hex");

    await prisma.rawEvent.upsert({
      where: {
        source_id_external_id: {
          source_id: source.id,
          external_id: txn.transaction_id,
        }
      },
      create: {
        source_id: source.id,
        external_id: txn.transaction_id,
        occurred_at: new Date(txn.date),
        sender: txn.merchant_name || txn.name,
        body: `Bank transaction: ${txn.name}`,
        body_hash: bodyHash,
        amount_minor: amountMinor,
        currency: currency,
        // We pre-parse it here so the Clusterer immediately understands it!
        raw_json: { vendorName: txn.merchant_name || txn.name },
        parsed_at: new Date(), 
        parser_version: 1,
      },
      update: {} // Idempotent: don't update if it already exists
    });
    newEvents++;
  }

  await prisma.sourceAccount.update({
    where: { id: source.id },
    data: { last_synced_at: new Date() }
  });

  console.log(`Trace: Plaid Sync Complete. Downloaded ${newEvents} new transactions.`);
  return newEvents;
}

function generateMockTransactions() {
  const dates = [];
  const today = new Date();
  // 3 months of mock "Amazon Prime" charges
  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setMonth(today.getMonth() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  return dates.map((date, i) => ({
    transaction_id: `mock-txn-amazon-${i}`,
    date: date,
    name: "Amazon Prime Subscription",
    merchant_name: "Amazon",
    amount: 14.99,
    iso_currency_code: "USD",
  }));
}
