import { NextResponse } from "next/server";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { prisma } from "../../../../lib/db";
import { syncGmailSource } from "../../../../lib/gmail/sync";

export async function POST() {
  const user = await requireCurrentUser();
  const sources = await prisma.sourceAccount.findMany({
    where: {
      kind: "gmail",
      status: "active",
      user_id: user.id,
    },
  });

  const results = [];
  for (const source of sources) {
    results.push(await syncGmailSource(source.id));
  }

  return NextResponse.json({ results });
}
