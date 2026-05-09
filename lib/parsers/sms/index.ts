export interface ParsedSMS {
  amountMinor: number;
  currency: string;
  vendorName: string;
  date: Date;
  senderCanonical: string;
  isRecurring: boolean;
}

// Map 6-char alphanumeric headers to canonical bank names
const SENDER_MAP: Record<string, string> = {
  "HDFCBK": "HDFC Bank",
  "ICICIB": "ICICI Bank",
  "AXISBK": "Axis Bank",
  "SBINB": "State Bank of India",
  "KOTAKB": "Kotak Mahindra Bank",
  "PAYTMB": "Paytm",
};

export function normalizeSMSSender(sender: string): string {
  // Strip prefixes like "VM-", "AD-", etc.
  const cleanSender = sender.replace(/^[A-Z]{2}-/, "").toUpperCase();
  return SENDER_MAP[cleanSender] || sender;
}

export function parseSMS(text: string, sender: string, receivedAt: Date): ParsedSMS | null {
  const canonicalSender = normalizeSMSSender(sender);
  
  // Pattern 1: e-NACH / Auto-debit mandates
  // Example: "Dear Customer, an e-NACH mandate for Rs 999.00 towards NETFLIX has been registered..."
  const enachRegex = /e-?NACH mandate.*?Rs\.?\s*([\d,]+(?:\.\d+)?).*?towards\s+([A-Za-z0-9\s]+)/i;
  const enachMatch = text.match(enachRegex);
  if (enachMatch) {
    return {
      amountMinor: Math.round(parseFloat(enachMatch[1].replace(/,/g, '')) * 100),
      currency: "INR",
      vendorName: enachMatch[2].trim(),
      date: receivedAt,
      senderCanonical: canonicalSender,
      isRecurring: true, // e-NACH is inherently recurring
    };
  }

  // Pattern 2: Generic UPI Debit
  // Example: "Rs.199.00 debited from a/c **1234 on 05-06-26 to VPA netflix@upi"
  const upiRegex = /(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)\s*debited.*?to(?:\s+VPA)?\s+([A-Za-z0-9.\-_@]+)/i;
  const upiMatch = text.match(upiRegex);
  if (upiMatch) {
    const vendor = upiMatch[2].split('@')[0]; // simple VPA cleanup
    return {
      amountMinor: Math.round(parseFloat(upiMatch[1].replace(/,/g, '')) * 100),
      currency: "INR",
      vendorName: vendor,
      date: receivedAt,
      senderCanonical: canonicalSender,
      // We rely on the clusterer to figure out if it's recurring based on gaps,
      // but we can look for hints.
      isRecurring: /recurring|subscription|auto-renew/i.test(text),
    };
  }

  // Pattern 3: Standard Bank Debit
  // Example: "Your a/c no. XX1234 is debited for Rs.499.00 on 05-06-26 and credited to SPOTIFY."
  const debitRegex = /debited.*?for\s*(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?).*?credited to\s+([A-Za-z0-9\s]+)\./i;
  const debitMatch = text.match(debitRegex);
  if (debitMatch) {
    return {
      amountMinor: Math.round(parseFloat(debitMatch[1].replace(/,/g, '')) * 100),
      currency: "INR",
      vendorName: debitMatch[2].trim(),
      date: receivedAt,
      senderCanonical: canonicalSender,
      isRecurring: /recurring|subscription/i.test(text),
    };
  }

  return null;
}
