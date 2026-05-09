"use server";

import { parseSMS } from "../../../lib/parsers/sms";
import { requireCurrentUser } from "../../../lib/auth/current-user";
import { prisma } from "../../../lib/db";
import crypto from "crypto";
import { clusterEventsForUser } from "../../../lib/clusterer";

export async function previewSMSAction(text: string, sender: string) {
  // Doesn't save to DB, just runs the parser for live feedback
  const result = parseSMS(text, sender, new Date());
  return result;
}

export async function ingestSMSAction(text: string, sender: string) {
  const user = await requireCurrentUser();
  
  const source = await prisma.sourceAccount.upsert({
    where: {
      user_id_kind_identifier: {
        user_id: user.id,
        kind: "sms_paste",
        identifier: "Pasted SMS",
      }
    },
    create: {
      user_id: user.id,
      kind: "sms_paste",
      identifier: "Pasted SMS",
      status: "active",
      last_synced_at: new Date(),
    },
    update: {
      last_synced_at: new Date(),
    }
  });

  const bodyHash = crypto.createHash("sha256").update(text.trim()).digest("hex");
  const externalId = `sms_${bodyHash.substring(0, 16)}`;
  const parsed = parseSMS(text, sender, new Date());

  await prisma.rawEvent.upsert({
    where: { source_id_external_id: { source_id: source.id, external_id: externalId } },
    create: {
      source_id: source.id,
      external_id: externalId,
      occurred_at: new Date(),
      sender: sender,
      body: text,
      body_hash: bodyHash,
      amount_minor: parsed ? BigInt(parsed.amountMinor) : null,
      currency: parsed ? parsed.currency : null,
      raw_json: { vendorName: parsed?.vendorName, isRecurring: parsed?.isRecurring },
      parsed_at: parsed ? new Date() : null,
      parser_version: 1,
    },
    update: {}
  });

  await clusterEventsForUser(user.id);
  return { success: true };
}
