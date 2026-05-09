import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'v6yB$E&H+MbQeThWmZq4t7w!z%C*F-Ja'; // 32 bytes
const IV_LENGTH = 16; 

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text.includes(':')) return text; // Return as-is if not encrypted
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Helper wrappers for tokens
export async function encryptToken(token: string, userId: string): Promise<string> {
  // We can include the userId in the encryption for extra security
  return encrypt(`${userId}:${token}`);
}

export async function decryptToken(encryptedToken: string, userId: string): Promise<string> {
  const decrypted = decrypt(encryptedToken);
  if (!decrypted.includes(':')) return decrypted;
  
  const [storedUserId, token] = decrypted.split(':');
  if (storedUserId !== userId) {
    throw new Error("Token security violation: User ID mismatch");
  }
  return token;
}
