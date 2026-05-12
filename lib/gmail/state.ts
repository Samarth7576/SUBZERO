import { createHmac } from "crypto";

export function gmailState(email: string, now = Date.now()): string {
  const window = Math.floor(now / (10 * 60 * 1000));
  const key = process.env.AUTH_SECRET ?? "fallback";
  const token = createHmac("sha256", key)
    .update(`gmail-oauth:${email}:${window}`)
    .digest("hex");
  console.log("gmailState computed:", { email, window, tokenPrefix: token.slice(0, 8) });
  return token;
}

export function verifyGmailState(state: string, email: string): boolean {
  const now = Date.now();
  const current = gmailState(email, now);
  const previous = gmailState(email, now - 10 * 60 * 1000);
  const match = state === current || state === previous;
  console.log("verifyGmailState:", { email, match, statePrefix: state.slice(0, 8), currentPrefix: current.slice(0, 8) });
  return match;
}
