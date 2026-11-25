import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const VERSION = "v1";

function getKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw new Error("FIELD_ENCRYPTION_KEY harus diisi dengan 64 karakter hex (32 byte).");
  }
  return Buffer.from(raw, "hex");
}

export function encryptField(plainText: string): string {
  if (typeof plainText !== "string") throw new TypeError("Nilai enkripsi harus berupa string.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptField(cipherText: string): string {
  const parts = cipherText.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Format ciphertext tidak dikenal; plaintext tidak akan dikembalikan.");
  }
  const [, ivHex, tagHex, encryptedHex] = parts;
  if (!/^[a-fA-F0-9]{24}$/.test(ivHex) || !/^[a-fA-F0-9]{32}$/.test(tagHex) ||
      !/^(?:[a-fA-F0-9]{2})*$/.test(encryptedHex)) {
    throw new Error("Ciphertext tidak valid.");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"), { authTagLength: 16 });
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
