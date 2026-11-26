import test from "node:test";
import assert from "node:assert/strict";
import { buildSafeAiPayload } from "../src/lib/ai/payload-builder.ts";
import { checkAiSummarySafety } from "../src/lib/ai/safety-guard.ts";
import { sanitizeAuditSnapshot } from "../src/lib/audit/sanitize.ts";

const base = {
  age_months: 14, sex_for_reference: "female" as const, visit_date: "2026-11-26",
  measurements: { weight_kg: 8.2, length_height_cm: 72, measurement_type: "recumbent_length" as const },
  previous_measurement: null, validated_assessments: [], verified_services: [],
  next_approved_reminders: [], approved_education_snippets: [],
};

test("AI payload strips direct identifiers from approved knowledge snippets", () => {
  const payload = buildSafeAiPayload({ ...base, approved_education_snippets: [{
    id: "doc-1", title: "Panduan", source_title: "Penerbit", version: "1",
    summary_tip: "Hubungi 081234567890 atau admin@example.org. NIK 1234567890123456.",
  }] });
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /081234567890|admin@example\.org|1234567890123456/);
  assert.match(serialized, /kontak dihapus/);
});

test("AI payload rejects impossible anthropometry values", () => {
  assert.throws(() => buildSafeAiPayload({ ...base, measurements: { ...base.measurements, weight_kg: -1 } }));
});

test("AI safety rejects clinical advice and direct identifiers", () => {
  assert.equal(checkAiSummarySafety("Berikan obat antibiotik dengan dosis tertentu kepada anak.", true).passed, false);
  assert.equal(checkAiSummarySafety("Hubungi 081234567890 untuk informasi lebih lanjut.", true).passed, false);
});

test("audit snapshots redact direct identifiers but preserve operational fields", () => {
  const result = sanitizeAuditSnapshot({ fullName: "Anak Contoh", weightKg: 8.2, guardianContact: "081234567890" }) as Record<string, unknown>;
  assert.equal(result.fullName, "[REDACTED]");
  assert.equal(result.guardianContact, "[REDACTED]");
  assert.equal(result.weightKg, 8.2);
});
