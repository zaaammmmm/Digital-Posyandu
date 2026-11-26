import test from "node:test";
import assert from "node:assert/strict";
import { validateSummaryProvenance } from "../src/lib/ai/summary-provenance.ts";

const valid = {
  visitId: "v1", childId: "c1", inputRecordVersion: 2,
  generatedAt: "2026-11-12T00:00:00.000Z", modelProvider: "google-gemini",
  modelVersion: "gemini-2.5-flash", promptVersion: "visit-summary-id-v1.1",
  knowledgeSourceIds: ["k1"], safetyStatus: "passed" as const,
};

test("accepts complete provenance", () => {
  assert.equal(validateSummaryProvenance(valid), true);
  assert.equal(validateSummaryProvenance({ ...valid, knowledgeSourceIds: [], safetyStatus: "fallback_template" }), true);
});

test("rejects incomplete or malformed provenance", () => {
  assert.equal(validateSummaryProvenance({ ...valid, promptVersion: "" }), false);
  assert.equal(validateSummaryProvenance({ ...valid, inputRecordVersion: 0 }), false);
  assert.equal(validateSummaryProvenance({ ...valid, generatedAt: "bukan-tanggal" }), false);
  assert.equal(validateSummaryProvenance({ ...valid, safetyStatus: "unknown" as never }), false);
});
