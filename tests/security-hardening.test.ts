import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("all authenticated API writes pass through a centralized per-user rate limit", () => {
  const auth = read("../src/lib/auth/server.ts");
  assert.match(auth, /consumeRateLimit\(\{ actorId: token\.uid, action: "authenticated-api-write", limit: 120, windowMs: 60_000 \}\)/);
  assert.match(auth, /status: 429/);
  assert.match(auth, /Retry-After/);
  assert.match(auth, /!\s*\["GET", "HEAD", "OPTIONS"\]\.includes\(req\.method\.toUpperCase\(\)\)/);
});

test("correction review updates its decision and audit record in one transaction", () => {
  const route = read("../src/app/api/corrections/[requestId]/route.ts");
  assert.match(route, /runTransaction\(async tx =>/);
  assert.match(route, /tx\.get\(ref\)/);
  assert.match(route, /tx\.update\(ref/);
  assert.match(route, /posyanduId: auth\.posyanduId \}, tx\)/);
});

test("visit rejection updates visit, measurements and audit atomically", () => {
  const route = read("../src/app/api/visits/[visitId]/reject/route.ts");
  assert.match(route, /runTransaction\(async tx =>/);
  assert.match(route, /tx\.get\(measurementQuery\)/);
  assert.match(route, /tx\.update\(doc\.ref/);
  assert.match(route, /posyanduId: auth\.posyanduId \}, tx\)/);
});

test("production preflight validates the exact encryption-key format used by AES-GCM", () => {
  const preflight = read("../scripts/production-preflight.mjs");
  const crypto = read("../src/lib/crypto/field-encryption.ts");
  assert.match(preflight, /\^\[a-fA-F0-9\]\{64\}\$/);
  assert.match(crypto, /\^\[a-fA-F0-9\]\{64\}\$/);
});
