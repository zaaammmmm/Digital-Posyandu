'use strict';
/*
 * CommonJS twin of src/lib/crypto/field-encryption.ts (AES-256-GCM, format v1:iv:tag:cipher).
 * Scripts cannot import the TypeScript module, so the format is duplicated here and
 * tests/demo-dataset.test.ts verifies that decryptField() can read what this produces.
 */
const crypto = require('node:crypto');

function getKey(raw = process.env.FIELD_ENCRYPTION_KEY) {
  if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) return null;
  return Buffer.from(raw, 'hex');
}

/** Returns an encrypt function, or null when FIELD_ENCRYPTION_KEY is missing/invalid. */
function createEncryptor(rawKey) {
  const key = getKey(rawKey);
  if (!key) return null;
  return function encryptField(plainText) {
    if (typeof plainText !== 'string') throw new TypeError('Nilai enkripsi harus berupa string.');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(':');
  };
}

module.exports = { createEncryptor };
