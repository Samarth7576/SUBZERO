import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireCurrentUser } from "../../../../lib/auth/current-user";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    
    // Fetch all raw events (transactions) for the user
    const events = await prisma.rawEvent.findMany({
      where: { source: { user_id: user.id } },
      orderBy: { occurred_at: 'desc' },
      include: { source: true }
    });

    if (events.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 400 });
    }

    // Convert to CSV
    const headers = ["Date", "Merchant/Sender", "Amount", "Currency", "Source", "Status"];
    const rows = events.map(event => [
      event.occurred_at.toISOString().split('T')[0],
      `"${event.sender.replace(/"/g, '""')}"`,
      (Number(event.amount_minor) / 100).toFixed(2),
      event.currency,
      event.source.kind,
      event.parsed_at ? "Matched" : "Pending"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ledger_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error("Export failed", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
