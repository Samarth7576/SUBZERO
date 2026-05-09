import { prisma } from "../db";

export interface ParsedEvent {
  vendorName: string;
  amountMinor: bigint;
  currency: string;
  confidence: number;
}

const VENDOR_PATTERNS = [
  { name: "Netflix", patterns: [/netflix/i], category: "Entertainment" },
  { name: "Spotify", patterns: [/spotify/i], category: "Entertainment" },
  { name: "Claude Pro", patterns: [/claude/i, /anthropic/i], category: "Software" },
  { name: "ChatGPT", patterns: [/openai/i, /chatgpt/i], category: "Software" },
];

export function parseRawEvent(body: string, subject: string): ParsedEvent | null {
  const fullText = `${subject} ${body}`.toLowerCase();
  console.log("Parsing text snippet:", fullText.substring(0, 100));
  
  // 1. Identify Vendor
  const vendor = VENDOR_PATTERNS.find(v => 
    v.patterns.some(p => p.test(fullText))
  );
  
  if (!vendor) {
    console.log("No vendor matched for text");
    return null;
  }

  console.log("Matched vendor:", vendor.name);

  // 2. Extract Amount
  // Matches things like "INR 649", "₹119.00", "$20.00", "649.00"
  const amountRegex = /(?:INR|₹|\$|USD)?\s?(\d{2,}(?:[.,]\d{2})?)/i;
  const match = fullText.match(amountRegex);
  
  if (!match) {
    console.log("No amount matched for text");
    return null;
  }

  let currency = "INR";
  if (fullText.includes("$") || fullText.includes("usd")) currency = "USD";
  if (fullText.includes("₹") || fullText.includes("inr")) currency = "INR";

  const amountStr = match[1].replace(",", "");
  const amountMinor = BigInt(Math.round(parseFloat(amountStr) * 100));

  console.log("Parsed amount:", amountMinor.toString(), currency);

  return {
    vendorName: vendor.name,
    amountMinor,
    currency,
    confidence: 0.9,
  };
}
