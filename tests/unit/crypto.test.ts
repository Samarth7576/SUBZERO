import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken, verifyRoundTrip } from "../../lib/crypto";

describe("Crypto token encryption", () => {
  const originalEnv = process.env.TOKEN_ENCRYPTION_SECRET;

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_SECRET = "0123456789abcdef0123456789abcdef"; // 32 chars
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.TOKEN_ENCRYPTION_SECRET = originalEnv;
    } else {
      delete process.env.TOKEN_ENCRYPTION_SECRET;
    }
  });

  it("should encrypt and decrypt a token successfully", async () => {
    const userId = "user_123";
    const token = "ya29.a0AfB_byCdefG1234567890";

    const isVerified = await verifyRoundTrip(token, userId);
    expect(isVerified).toBe(true);
  });

  it("returns base64 ciphertext and never the raw token", async () => {
    const encrypted = await encryptToken("refresh-token-value", "user_123");

    expect(encrypted).toMatch(/^lsb1:[A-Za-z0-9+/]+={0,2}$/);
    expect(encrypted).not.toContain("refresh-token-value");
  });

  it("should fail to decrypt if user ID changes (domain separation)", async () => {
    const token = "secret_token_123";

    const encrypted = await encryptToken(token, "user_A");

    await expect(decryptToken(encrypted, "user_B")).rejects.toThrow();
  });
});
