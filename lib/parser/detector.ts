import { prisma } from "../db";
import { parseRawEvent } from "./index";

export async function detectSubscriptionsForUser(userId: string) {
  let processed = 0;
  let matched = 0;

  // 1. Get all unparsed raw events
  const unparsedEvents = await prisma.rawEvent.findMany({
    where: {
      source: { user_id: userId },
      parsed_at: null,
    },
    include: { source: true },
  });

  processed = unparsedEvents.length;

  for (const event of unparsedEvents) {
    const parsed = parseRawEvent(event.body || "", event.subject || "");
    
    if (parsed) {
      matched++;
      // 2. Find or create the vendor
      const vendor = await prisma.vendor.upsert({
        where: { canonical_name: parsed.vendorName },
        create: {
          canonical_name: parsed.vendorName,
          aliases: [parsed.vendorName],
        },
        update: {},
      });

      // 3. Find or create the subscription
      const subscription = await prisma.subscription.upsert({
        where: {
          // Simplistic matching for now: same user, same vendor
          id: (await prisma.subscription.findFirst({
            where: { user_id: userId, vendor_id: vendor.id }
          }))?.id || "00000000-0000-0000-0000-000000000000", // dummy if not found
        },
        create: {
          user_id: userId,
          vendor_id: vendor.id,
          display_name: parsed.vendorName,
          amount_minor: parsed.amountMinor,
          currency: parsed.currency,
          cycle: "monthly",
          first_seen_on: event.occurred_at,
          last_charge_on: event.occurred_at,
          status: "active",
          confidence: parsed.confidence,
        },
        update: {
          last_charge_on: event.occurred_at,
          amount_minor: parsed.amountMinor,
        },
      });

      // 4. Link event to subscription
      await prisma.subscriptionEvent.create({
        data: {
          subscription_id: subscription.id,
          raw_event_id: event.id,
        },
      });

      // 5. Mark event as parsed
      await prisma.rawEvent.update({
        where: { id: event.id },
        data: { parsed_at: new Date() },
      });
    }
  }

  return { processed, matched };
}
