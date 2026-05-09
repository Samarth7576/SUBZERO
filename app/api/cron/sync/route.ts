import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { syncGmailSource } from "../../../../lib/gmail/sync";
import { syncPlaidSource } from "../../../../lib/plaid/sync";

// Next.js config to allow this API route to run for up to 5 minutes
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Security check to ensure only the Cron Job (e.g. Vercel Cron) can trigger this
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === "production" && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log("CRON: Starting daily automated sync...");
  let syncedSources = 0;
  let newEventsFound = 0;

  try {
    // 1. Find all active data sources in the entire database
    const activeSources = await prisma.sourceAccount.findMany({
      where: { status: "active" }
    });

    // 2. Loop through and sync them (In a real massive app, you'd use a queue like Inngest, 
    // but for our MVP, a sequential loop in a long-running Vercel function works fine!)
    for (const source of activeSources) {
      try {
        if (source.kind === "gmail") {
          const result = await syncGmailSource(source.id);
          newEventsFound += result.inserted;
        } else if (source.kind === "plaid") {
          const count = await syncPlaidSource(source.id);
          newEventsFound += count;
        }
        syncedSources++;
      } catch (err) {
        console.error(`CRON: Failed to sync source ${source.id}:`, err);
        // We continue to the next user even if one fails
      }
    }

    // 3. Since we found new raw events, trigger the Clusterer API to analyze them
    // Note: In production, we would trigger the clusterer via a separate background queue job, 
    // but for the MVP we can just hit our own API.
    if (newEventsFound > 0) {
      console.log(`CRON: Found ${newEventsFound} new events. Triggering Brain analysis...`);
      // Hit the detection route locally
      await fetch(new URL('/api/subscriptions/detect', request.url).toString(), {
        method: 'POST',
      }).catch(e => console.error("CRON: Failed to trigger clusterer", e));
    }

    return NextResponse.json({ 
      success: true, 
      syncedSources, 
      newEventsFound 
    });

  } catch (error) {
    console.error("CRON: Global Sync Error", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
