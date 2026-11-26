import test from "node:test";
import assert from "node:assert/strict";
import { calculateLmsZScore, validateLmsDatasetRows } from "../src/lib/growth/lms.ts";
import { canApproveImmunizationRule, validateImmunizationRuleDraft } from "../src/lib/schedule/immunization-rule-validation.ts";
import { isScheduleRuleUsable } from "../src/lib/schedule/approved-catalog.ts";

test("LMS formula handles L=0 and non-zero L without classifying clinically", () => {
  assert.equal(calculateLmsZScore(12, { l: 0, m: 10, s: 0.1 }), Math.log(1.2) / 0.1);
  assert.ok(Math.abs((calculateLmsZScore(12, { l: 1, m: 10, s: 0.1 }) ?? 0) - 2) < 1e-12);
  assert.equal(calculateLmsZScore(0, { l: 0, m: 10, s: 0.1 }), null);
  assert.equal(calculateLmsZScore(12, { l: 0, m: 0, s: 0.1 }), null);
});

test("LMS dataset validator rejects empty, duplicate and invalid rows", () => {
  assert.equal(validateLmsDatasetRows([]).valid, false);
  const row = { indicator: "WAZ", sex: "female", measure: "age_months", at: 12, l: 0, m: 9, s: 0.1 };
  assert.equal(validateLmsDatasetRows([row]).valid, true);
  assert.equal(validateLmsDatasetRows([{ ...row, measure: "length_height_cm" }]).valid, false);
  const duplicate = validateLmsDatasetRows([row, row]);
  assert.equal(duplicate.valid, false);
  assert.ok(duplicate.errors.includes("ROW_1_DUPLICATE_COORDINATE"));
});

test("immunization rule drafts require complete metadata and HTTPS source", () => {
  const draft = { vaccineCode: "VAX-01", name: "Contoh label dari sumber", targetAgeMonths: 6,
    version: "2026.1", effectiveFrom: "2026-01-01", officialSource: "https://example.org/official.pdf",
    sourceDocumentVersion: "2026" };
  assert.equal(validateImmunizationRuleDraft(draft).valid, true);
  assert.equal(validateImmunizationRuleDraft({ ...draft, officialSource: "http://example.org" }).valid, false);
  assert.equal(validateImmunizationRuleDraft({ ...draft, targetAgeMonths: -1 }).valid, false);
});

test("only complete draft rules can be approved", () => {
  const draft = { id: "r1", vaccineCode: "VAX-01", name: "Vaccine", targetAgeMonths: 6,
    version: "2026.1", effectiveFrom: "2026-01-01", officialSource: "https://example.org/source",
    sourceDocumentVersion: "2026", status: "draft" };
  assert.equal(canApproveImmunizationRule(draft), true);
  assert.equal(canApproveImmunizationRule({ ...draft, status: "approved" }), false);
  assert.equal(canApproveImmunizationRule({ ...draft, officialSource: "http://example.org" }), false);
});


test("approved schedule rules require HTTPS provenance and valid approval metadata", () => {
  const rule = { id: "r1", vaccineCode: "VAX-01", name: "Vaccine", targetAgeMonths: 6,
    version: "2026.1", effectiveFrom: "2026-01-01", officialSource: "https://example.org/source",
    sourceDocumentVersion: "2026", status: "approved" as const, approvedBy: "reviewer-1", approvedAt: "2026-01-02T00:00:00.000Z" };
  assert.equal(isScheduleRuleUsable(rule), true);
  assert.equal(isScheduleRuleUsable({ ...rule, officialSource: "DATA DEMO — bukan jadwal resmi" }), false);
  assert.equal(isScheduleRuleUsable({ ...rule, approvedAt: "not-a-date" }), false);
});
