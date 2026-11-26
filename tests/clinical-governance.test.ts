import test from "node:test";
import assert from "node:assert/strict";
import { assessReferenceReadiness } from "../src/lib/growth/reference-registry.ts";
import { getApprovedUpcomingRules, isScheduleRuleUsable } from "../src/lib/schedule/approved-catalog.ts";

test("growth reference stays unavailable without an approved manifest", () => {
  assert.equal(assessReferenceReadiness(null).ready, false);
});

test("growth reference metadata requires provenance and checksum", () => {
  const result = assessReferenceReadiness({
    status: "approved", standard: "WHO", version: "v1", sourceTitle: "Official standard",
    sourceUrl: "https://example.org/reference", effectiveFrom: "2026-01-01",
    approvedBy: "reviewer-1", approvedAt: "2026-01-02T00:00:00.000Z",
    datasetSha256: "a".repeat(64), goldenTestSuiteVersion: "golden-v1",
  });
  assert.equal(result.ready, true);
  assert.match(result.reason, /RUNTIME_DATASET_VALIDATION/);
});

test("draft or incomplete immunization rules are never presented as upcoming", () => {
  const base = {
    id: "r1", vaccineCode: "V1", name: "Vaccine", targetAgeMonths: 6, version: "1",
    effectiveFrom: "2026-01-01", officialSource: "https://example.org/official",
    sourceDocumentVersion: "2026", approvedBy: "clinician", approvedAt: "2026-01-02",
  };
  assert.equal(isScheduleRuleUsable({ ...base, status: "draft" }), false);
  assert.deepEqual(getApprovedUpcomingRules([
    { ...base, status: "draft" }, { ...base, id: "r2", vaccineCode: "V2", status: "approved" },
  ], 3, [] ).map(rule => rule.id), ["r2"]);
});
