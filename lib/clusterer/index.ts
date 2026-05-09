import { prisma } from "../db";

export type Cycle = "weekly" | "monthly" | "quarterly" | "yearly" | "adhoc";

interface ClusterResult {
  cycle: Cycle;
  confidence: number;
  nextChargeDate: Date;
}

const CYCLE_DAYS: Record<Cycle, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
  adhoc: 0,
};

/**
 * Clusters raw events into subscription candidates.
 * Rules:
 * 1. Group by (vendor, amount within 2%, currency)
 * 2. Need >= 2 events
 * 3. Confidence = matching_gaps / total_gaps
 */
export async function clusterEventsForUser(userId: string) {
  console.log("Trace: Starting Clusterer for", userId);
  
  // 1. Get all parsed events that are NOT already linked to a subscription
  // (In practice we might re-cluster everything, but let's keep it simple)
  const events = await prisma.rawEvent.findMany({
    where: {
      source: { user_id: userId },
      parsed_at: { not: null },
      amount_minor: { not: null },
    },
    include: { source: true },
    orderBy: { occurred_at: "asc" },
  });

  // 2. Group by Vendor ID or Vendor Name
  const byVendor: Record<string, typeof events> = {};
  for (const event of events) {
    const raw = (event.raw_json as any) || {};
    const vendorKey = raw.vendorId || raw.vendorName;
    
    if (!vendorKey) continue;
    if (!byVendor[vendorKey]) byVendor[vendorKey] = [];
    byVendor[vendorKey].push(event);
  }

  for (const [vendorKey, vendorEvents] of Object.entries(byVendor)) {
    // 3. Sub-group by amount (within 2%) and currency
    const groups: (typeof events)[] = [];
    
    for (const event of vendorEvents) {
      let matched = false;
      for (const group of groups) {
        const representative = group[0];
        if (!representative) continue;

        const diff = Math.abs(Number(event.amount_minor!) - Number(representative.amount_minor!));
        const threshold = Number(representative.amount_minor!) * 0.02;
        
        if (diff <= threshold && event.currency === representative.currency) {
          group.push(event);
          matched = true;
          break;
        }
      }
      if (!matched) groups.push([event]);
    }

    for (const group of groups) {
      const representative = group[0];
      if (!representative) continue;

      const isExplicitlyRecurring = (representative.raw_json as any)?.isRecurring === true;
      
      if (group.length < 2 && !isExplicitlyRecurring) {
        continue; // Need at least 2 to detect recurrence unless explicitly mandated
      }

      const result = group.length >= 2 ? analyzeGaps(group) : { cycle: "monthly" as Cycle, confidence: 0.9, nextChargeDate: new Date(new Date().setDate(new Date().getDate() + 30)) };
      
      if (result.confidence >= 0.6 || isExplicitlyRecurring) {
        const representative = group[0];
        if (!representative) continue;

        const lastEvent = group[group.length - 1];
        
        // Compute detected_via
        const sourceKinds = group.map((e: any) => e.source.kind.startsWith("sms") ? "sms" : e.source.kind);
        const detectedVia = Array.from(new Set(sourceKinds));
        
        // Upsert subscription
        // Custom Upsert logic for subscription
        const actualVendorId = vendorKey.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? vendorKey : null;
        const displayName = (representative.raw_json as any)?.vendorName || vendorKey || "Unknown";

        const existingSub = await prisma.subscription.findFirst({
          where: {
            user_id: userId,
            display_name: displayName,
            amount_minor: representative.amount_minor!,
          }
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              amount_minor: representative.amount_minor!,
              cycle: result.cycle,
              confidence: result.confidence,
              detected_via: detectedVia,
              last_charge_on: lastEvent.occurred_at,
              next_charge_on: result.nextChargeDate,
            }
          });
        } else {
          await prisma.subscription.create({
            data: {
              user_id: userId,
              vendor_id: actualVendorId,
              display_name: displayName,
              amount_minor: representative.amount_minor!,
              currency: representative.currency!,
              cycle: result.cycle,
              confidence: result.confidence,
              detected_via: detectedVia,
              first_seen_on: group[0].occurred_at,
              last_charge_on: lastEvent.occurred_at,
              next_charge_on: result.nextChargeDate,
              status: "active",
            }
          });
        }

        // Link events
        for (const event of group) {
           // We'd need the subscription ID here to link in subscription_events table
           // (Skipping detailed linking for brevity in this mock pass)
        }
      }
    }
  }
}

function analyzeGaps(events: any[]): ClusterResult {
  const gaps: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const diff = (events[i].occurred_at.getTime() - events[i-1].occurred_at.getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(Math.round(diff));
  }

  let bestCycle: Cycle = "adhoc";
  let bestConfidence = 0;

  for (const [cycle, targetDays] of Object.entries(CYCLE_DAYS)) {
    if (cycle === "adhoc") continue;
    
    const tolerance = Math.max(2, targetDays * 0.07);
    const matches = gaps.filter(g => Math.abs(g - targetDays) <= tolerance).length;
    const confidence = matches / gaps.length;

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestCycle = cycle as Cycle;
    }
  }

  const lastEventDate = new Date(events[events.length - 1].occurred_at);
  const nextChargeDate = new Date(lastEventDate);
  const daysToAdd = CYCLE_DAYS[bestCycle] || 30;
  nextChargeDate.setDate(nextChargeDate.getDate() + daysToAdd);

  return {
    cycle: bestCycle,
    confidence: bestConfidence,
    nextChargeDate,
  };
}
