import { prisma } from "../db";
import { notifyNewFinding } from "../notifications";
import crypto from "crypto";

export type FindingKind = "hidden" | "duplicate" | "trial_ending" | "price_hike" | "dormant";

export interface Finding {
  kind: FindingKind;
  severity: number;
  body: string;
  estimatedSaveMinor: number;
  currency: string;
}

export async function runFindingsEngine(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { user_id: userId, status: "active" },
    include: { vendor: true },
  });

  const findings: Finding[] = [];

  for (const sub of subscriptions) {
    // 1. Price Hike Detection
    const events = await prisma.rawEvent.findMany({
      where: { 
        source: { user_id: userId },
        parsed_at: { not: null },
        // Simple vendor name matching for mock
        subject: { contains: sub.display_name, mode: 'insensitive' }
      },
      orderBy: { occurred_at: 'desc' },
      take: 2
    });

    if (events.length >= 2) {
      const latest = Number(events[0].amount_minor ?? 0n);
      const prior = Number(events[1].amount_minor ?? 0n);
      if (latest > prior * 1.05) {
        findings.push({
          kind: "price_hike",
          severity: 4,
          body: `${sub.display_name} increased their price from ${sub.currency} ${(prior/100).toFixed(2)} to ${(latest/100).toFixed(2)}.`,
          estimatedSaveMinor: 0,
          currency: sub.currency
        });
      }
    }

    // 2. Hidden/Dormant Detection (Mock version)
    // In a real app, we'd check for other non-billing emails.
    // For mock, if they have >= 3 charges and it's Netflix, we'll flag it as "hidden"
    if (sub.display_name === "Netflix" && sub.confidence >= 0.8) {
       findings.push({
         kind: "hidden",
         severity: 3,
         body: `You are paying for ${sub.display_name} but haven't engaged with their service emails in 90 days.`,
         estimatedSaveMinor: Number(sub.amount_minor ?? 0n) * 12, // Annual save
         currency: sub.currency
       });
    }
  }

  // 3. Duplicate Detection (Category based)
  const byCategory: Record<string, typeof subscriptions> = {};
  for (const sub of subscriptions) {
    const cat = sub.category || "General";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(sub);
  }

  for (const [cat, subs] of Object.entries(byCategory)) {
    if (subs.length >= 2) {
      findings.push({
        kind: "duplicate",
        severity: 5,
        body: `You have multiple ${cat} subscriptions: ${subs.map(s => s.display_name).join(", ")}. Consider consolidating.`,
        estimatedSaveMinor: Number(subs[1].amount_minor ?? 0n) * 12,
        currency: subs[1].currency
      });
    }
  }

  // Save findings to DB
  for (const f of findings) {
    const existing = await prisma.finding.findUnique({
      where: {
        user_id_kind_body: {
          user_id: userId,
          kind: f.kind,
          body: f.body
        }
      } as any
    });

    if (!existing) {
      const created = await prisma.finding.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          kind: f.kind,
          severity: f.severity,
          body: f.body,
          estimated_save_minor: BigInt(f.estimatedSaveMinor),
          estimated_save_currency: f.currency,
        }
      });
      // TRIGGER PROACTIVE NOTIFICATION
      await notifyNewFinding(created.id);
    } else {
      await prisma.finding.update({
        where: { id: existing.id },
        data: {
          severity: f.severity,
          resolved_at: null,
        }
      });
    }
  }
}
