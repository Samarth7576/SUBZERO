import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { parseSMS } from "../../../../lib/parsers/sms";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import crypto from "crypto";
import { clusterEventsForUser } from "../../../../lib/clusterer";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { text, sender = "UNKNOWN", sourceKind = "sms_paste" } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "SMS text is required" }, { status: 400 });
    }

    // 1. Ensure a SourceAccount exists for this SMS type
    const sourceIdentifier = sourceKind === "sms_android" ? "Android SMS" : "Pasted SMS";
    const source = await prisma.sourceAccount.upsert({
      where: {
        user_id_kind_identifier: {
          user_id: user.id,
          kind: sourceKind,
          identifier: sourceIdentifier,
        }
      },
      create: {
        user_id: user.id,
        kind: sourceKind,
        identifier: sourceIdentifier,
        status: "active",
        last_synced_at: new Date(),
      },
      update: {
        last_synced_at: new Date(),
      }
    });

    // 2. Hash body for dedup
    const bodyHash = crypto.createHash("sha256").update(text.trim()).digest("hex");
    const externalId = `sms_${bodyHash.substring(0, 16)}`; // Generate a mock external ID

    // 3. Parse the SMS
    const parsed = parseSMS(text, sender, new Date());

    // 4. Save to Raw Events
    await prisma.rawEvent.upsert({
      where: {
        source_id_external_id: {
          source_id: source.id,
          external_id: externalId,
        }
      },
      create: {
        source_id: source.id,
        external_id: externalId,
        occurred_at: new Date(),
        sender: sender,
        body: text, // In production, we'd redact PII here
        body_hash: bodyHash,
        amount_minor: parsed ? BigInt(parsed.amountMinor) : null,
        currency: parsed ? parsed.currency : null,
        raw_json: { vendorName: parsed?.vendorName, isRecurring: parsed?.isRecurring },
        parsed_at: parsed ? new Date() : null,
        parser_version: 1,
      },
      update: {
        // Idempotent
      }
    });

    // 5. Run the Clusterer immediately to catch new subs
    await clusterEventsForUser(user.id);

    return NextResponse.json({ 
      success: true, 
      parsed: parsed 
    });

  } catch (error: any) {
    console.error("SMS Ingest Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
