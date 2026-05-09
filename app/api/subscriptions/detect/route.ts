import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { detectSubscriptionsForUser } from "../../../../lib/parser/detector";
import { clusterEventsForUser } from "../../../../lib/clusterer";
import { runFindingsEngine } from "../../../../lib/findings";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const result = await detectSubscriptionsForUser(user.id);
    
    // Phase 4: Run the recurrence clusterer
    await clusterEventsForUser(user.id);

    // Phase 5: Run the findings engine to surface insights
    await runFindingsEngine(user.id);
    
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error: any) {
    console.error("Detection Error:", error);
    return NextResponse.json({ error: "Failed to detect subscriptions", message: error.message }, { status: 500 });
  }
}
