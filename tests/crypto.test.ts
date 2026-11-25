import test from "node:test";
import assert from "node:assert/strict";
import { encryptField, decryptField } from "../src/lib/crypto/field-encryption.ts";

test("AES-GCM encrypt/decrypt round trip and reject tampering", () => {
  process.env.FIELD_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const encrypted = encryptField("kontak wali");
  assert.equal(decryptField(encrypted), "kontak wali");
  const parts = encrypted.split(":");
  parts[3] = "00" + parts[3].slice(2);
  assert.throws(() => decryptField(parts.join(":")));
});

test("encryption fails closed without a configured key", () => {
  delete process.env.FIELD_ENCRYPTION_KEY;
  assert.throws(() => encryptField("sensitive"));
});
