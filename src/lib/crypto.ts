import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
// Fallback key if process.env.AES_SECRET_KEY is not defined
const DEFAULT_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function getKey(): Buffer {
  const hex = process.env.AES_SECRET_KEY || DEFAULT_KEY_HEX;
  return Buffer.from(hex, "hex");
}

/**
 * Encrypts sensitive text using AES-256-GCM
 */
export function encryptAES256(text: string): string {
  if (!text) return "";
  try {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("AES Encryption Error:", err);
    return text;
  }
}

/**
 * Decrypts AES-256-GCM encrypted text
 */
export function decryptAES256(cipherText: string): string {
  if (!cipherText || !cipherText.includes(":")) return cipherText;
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) return cipherText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("AES Decryption Error:", err);
    return cipherText;
  }
}
