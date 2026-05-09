import { createHash } from "node:crypto";

const OTP_PATTERN = /\b(?:otp|code|verification code)\D{0,20}\d{4,8}\b/gi;
const CARD_OR_ACCOUNT_PATTERN = /\b(?:\d[ -]?){12,19}\b/g;
const LONG_ACCOUNT_PATTERN = /\b(?:account|acct|a\/c|card)\D{0,12}(\d{4,})\b/gi;
const ADDRESS_PATTERN =
  /\b\d{1,6}[A-Za-z]?\s+[A-Za-z0-9.' -]{2,80}?\s+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|block|sector|nagar|layout)\b\.?/gi;

export function normalizeBody(body: string): string {
  return body.replace(/\s+/g, " ").trim().toLowerCase();
}

export function hashBody(body: string): string {
  return createHash("sha256").update(normalizeBody(body)).digest("hex");
}

export function redactPii(body: string): string {
  return body
    .replace(OTP_PATTERN, "[REDACTED_OTP]")
    .replace(CARD_OR_ACCOUNT_PATTERN, (match) => {
      const digits = match.replace(/\D/g, "");
      if (digits.length < 12) {
        return match;
      }
      return `[REDACTED_NUMBER_LAST4_${digits.slice(-4)}]`;
    })
    .replace(LONG_ACCOUNT_PATTERN, (match, digits: string) =>
      match.replace(digits, `[REDACTED_ACCOUNT_LAST4_${digits.slice(-4)}]`),
    )
    .replace(ADDRESS_PATTERN, "[REDACTED_ADDRESS]");
}
