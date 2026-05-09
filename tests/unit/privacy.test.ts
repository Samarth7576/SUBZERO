import { describe, expect, it } from "vitest";
import { hashBody, normalizeBody, redactPii } from "../../lib/privacy";

describe("privacy helpers", () => {
  it("normalizes whitespace and casing before hashing", () => {
    expect(normalizeBody("  Total   Paid  ")).toBe("total paid");
    expect(hashBody("Total Paid")).toBe(hashBody(" total   paid "));
  });

  it("redacts OTPs and long card numbers while keeping last four", () => {
    const redacted = redactPii(
      "Your OTP is 123456. Card 4111 1111 1111 4242 was charged.",
    );

    expect(redacted).toContain("[REDACTED_OTP]");
    expect(redacted).toContain("[REDACTED_NUMBER_LAST4_4242]");
    expect(redacted).not.toContain("123456");
    expect(redacted).not.toContain("4111 1111 1111 4242");
  });

  it("redacts full account numbers and likely street addresses", () => {
    const redacted = redactPii(
      "Account number 9876543210 billed at 221B Baker Street.",
    );

    expect(redacted).toContain("[REDACTED_ACCOUNT_LAST4_3210]");
    expect(redacted).toContain("[REDACTED_ADDRESS]");
  });
});
