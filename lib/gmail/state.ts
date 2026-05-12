import { createHmac } from "crypto";

export function gmailState(userId: string, now = Date.now()): string {
  const window = Math.floor(now / (10 * 60 * 1000));
  return createHmac("sha256", process.env.AUTH_SECRET ?? "fallback")
    .update(`gmail-oauth:${userId}:${window}`)
    .digest("hex");
}

export function verifyGmailState(state: string, userId: string): boolean {
  const now = Date.now();
  const current = gmailState(userId, now);
  const previous = gmailState(userId, now - 10 * 60 * 1000);
  return state === current || state === previous;
}
