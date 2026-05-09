import { prisma } from "../db";

export async function notifyNewFinding(findingId: string) {
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { user: true }
  });

  if (!finding || !finding.user.email) return;

  // In a million-dollar app, we use a service like Resend, SendGrid, or AWS SES.
  // For this project, we'll simulate the "proactive" part by logging it clearly.
  // We could also integrate with a real Nodemailer instance if configured.

  console.log(`
    --- PROACTIVE ALERT ---
    TO: ${finding.user.email}
    SUBJECT: 🚨 Urgent: New Financial Insight for your Ledger
    
    Hi ${finding.user.name || 'there'},
    
    We just detected a potential issue with your subscriptions:
    
    [${finding.kind.toUpperCase()}]
    ${finding.body}
    
    Severity Level: ${finding.severity}/5
    Estimated Savings: ${finding.estimated_save_currency} ${(Number(finding.estimated_save_minor) / 100).toFixed(2)}
    
    Log in to your dashboard to take action: ${process.env.NEXTAUTH_URL}/dashboard
    
    Stay secure,
    The Ledger Team
    -----------------------
  `);

  // Mark as notified in DB if we had such a field, for now just logging.
}
