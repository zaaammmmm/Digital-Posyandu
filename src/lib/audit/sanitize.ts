const SENSITIVE_KEY = /(name|contact|phone|email|address|nik|identity|guardian|birth|dob|full.?name|medical.?note|notes)/i;
const MAX_DEPTH = 4;

/** Keep audit context useful while avoiding a second copy of direct identifiers. */
export function sanitizeAuditSnapshot(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (depth > MAX_DEPTH) return "[TRUNCATED]";
  if (Array.isArray(value)) return value.slice(0, 30).map(item => sanitizeAuditSnapshot(item, depth + 1));
  if (typeof value !== "object") {
    if (typeof value === "string") return value.slice(0, 500);
    if (typeof value === "number" || typeof value === "boolean") return value;
    return String(value).slice(0, 200);
  }
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>).slice(0, 60)) {
    output[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitizeAuditSnapshot(nested, depth + 1);
  }
  return output;
}

export function sanitizeAuditText(value: string): string {
  return value.slice(0, 2000)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL REDACTED]")
    .replace(/(?:\+?62|0)8[1-9][0-9\s-]{6,13}/g, "[PHONE REDACTED]")
    .replace(/\b\d{16}\b/g, "[IDENTIFIER REDACTED]");
}
