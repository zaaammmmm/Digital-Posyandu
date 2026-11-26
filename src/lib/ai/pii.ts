/** Direct-identifier and secret detection shared by the chatbot input/output paths. */

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE = /(?:\+?62|0)8[1-9][0-9\s-]{6,13}/;
const LONG_ID = /\b\d{12,16}\b/;

const SECRET_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_-]{30,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b[0-9a-f]{64}\b/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  /\b(FIELD_ENCRYPTION_KEY|GEMINI_API_KEY|FIREBASE_ADMIN_PRIVATE_KEY|FIREBASE_ADMIN_CLIENT_EMAIL)\b/,
];

export function containsDirectIdentifier(text: string): boolean {
  return EMAIL.test(text) || PHONE.test(text) || LONG_ID.test(text);
}

export function containsSecret(text: string): boolean {
  return SECRET_PATTERNS.some(pattern => pattern.test(text));
}

/** Replace direct identifiers before text leaves the server (LLM calls, logs). */
export function redactDirectIdentifiers(text: string): string {
  return text
    .replace(new RegExp(EMAIL.source, "gi"), "[kontak dihapus]")
    .replace(new RegExp(PHONE.source, "g"), "[kontak dihapus]")
    .replace(new RegExp(LONG_ID.source, "g"), "[nomor identitas dihapus]");
}

/** Remove identifiers entirely (for search queries, where placeholder words would pollute ranking). */
export function stripDirectIdentifiers(text: string): string {
  return text
    .replace(new RegExp(EMAIL.source, "gi"), " ")
    .replace(new RegExp(PHONE.source, "g"), " ")
    .replace(new RegExp(LONG_ID.source, "g"), " ")
    .replace(/\s+/g, " ").trim();
}
