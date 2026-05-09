const BILLING_SENDERS = [
  "netflix.com",
  "spotify.com",
  "youtube.com",
  "google.com",
  "disneyplus.com",
  "hotstar.com",
  "apple.com",
  "amazon.com",
  "amazon.in",
  "adobe.com",
  "notion.so",
  "figma.com",
  "github.com",
  "vercel.com",
  "microsoft.com",
  "dropbox.com",
  "jio.com",
  "airtel.in",
  "zomato.com",
  "swiggy.in",
  "rogers.com",
  "bell.ca",
  "telus.com",
  "fido.ca",
];

export function buildGmailBillingQuery(after?: Date): string {
  const senderQuery = BILLING_SENDERS.map((sender) => `from:${sender}`).join(
    " OR ",
  );
  const subjectQuery = [
    "receipt",
    "invoice",
    "subscription",
    "renewal",
    '"auto-renew"',
    '"free trial"',
  ]
    .map((keyword) => `subject:${keyword}`)
    .join(" OR ");
  const dateQuery = after
    ? ` after:${formatGmailDate(after)}`
    : ` newer_than:18m`;

  return `(category:purchases OR ${subjectQuery} OR ${senderQuery})${dateQuery}`;
}

function formatGmailDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}
