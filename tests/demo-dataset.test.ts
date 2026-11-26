import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { calculateAgeMonths } from "../src/lib/growth/age.ts";
import { validateAnthropometry } from "../src/lib/growth/anthropometry-validator.ts";
import { calculateGrowthIndicators } from "../src/lib/growth/growth-engine.ts";
import { checkAiSummarySafety, buildFallbackSummary } from "../src/lib/ai/safety-guard.ts";
import { validateSummaryProvenance } from "../src/lib/ai/summary-provenance.ts";
import { getApprovedUpcomingRules, isScheduleRuleUsable, type ApprovedScheduleRule } from "../src/lib/schedule/approved-catalog.ts";
import { decryptField } from "../src/lib/crypto/field-encryption.ts";

const require = createRequire(import.meta.url);
const { buildDemoDataset, MARKER, COLLECTIONS } = require("../scripts/demo-data/dataset.cjs");
const { createEncryptor } = require("../scripts/demo-data/field-encryption.cjs");

type Doc = { id: string; data: Record<string, any> };
const NOW = new Date("2026-11-26T05:00:00.000Z");
const KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const parents = (n: number) => Array.from({ length: n }, (_, i) => ({ uid: `parent-${i + 1}`, displayName: `Wali ${i + 1}` }));
const actors = (n: number) => ({ cadres: ["cadre-1", "cadre-2"], healthWorkers: ["hw-1"], admins: ["admin-1"], reviewers: ["rev-1"], parents: parents(n) });
const build = (n = 2, extra: Record<string, unknown> = {}) =>
  buildDemoDataset({ posyanduId: "tenant-a", now: NOW, actors: actors(n), ...extra });
const docs = (ds: any, c: string): Doc[] => ds.collections[c];
const byId = (ds: any, c: string) => new Map(docs(ds, c).map(d => [d.id, d.data]));

test("every collection is covered, ids are unique demo ids and carry the marker", () => {
  const ds = build();
  assert.deepEqual(Object.keys(ds.collections).sort(), [...COLLECTIONS].sort());
  for (const c of COLLECTIONS) {
    assert.ok(docs(ds, c).length > 0, `${c} is empty`);
    const ids = docs(ds, c).map(d => d.id);
    assert.equal(new Set(ids).size, ids.length, `${c} has duplicate ids`);
    for (const d of docs(ds, c)) {
      assert.ok(d.id.startsWith("demo-"), `${c}/${d.id}`);
      assert.equal(d.data.seededBy, MARKER);
      assert.equal(JSON.stringify(d.data).includes("undefined"), false);
    }
  }
});

test("tenant-scoped documents belong to the target tenant; global ones have no tenant", () => {
  const ds = build();
  const global = new Set(["education_content", "knowledge_documents", "immunization_schedule_rules"]);
  for (const c of COLLECTIONS) for (const d of docs(ds, c)) {
    if (global.has(c)) assert.equal(d.data.posyanduId, undefined, `${c}/${d.id}`);
    else assert.equal(d.data.posyanduId, "tenant-a", `${c}/${d.id}`);
  }
});

test("output is deterministic for the same input", () => {
  assert.deepEqual(
    build(2, { encrypt: null }).collections,
    build(2, { encrypt: null }).collections,
  );
});

test("references between collections resolve and respect child/visit ownership", () => {
  const ds = build(2);
  const children = byId(ds, "children"), visits = byId(ds, "visits"), meas = byId(ds, "anthropometry_measurements");
  const guardians = byId(ds, "guardians"), consents = byId(ds, "consent_records");
  for (const [id, v] of visits) assert.ok(children.has(v.childId), `visit ${id}`);
  for (const [id, m] of meas) {
    const v = visits.get(m.visitId);
    assert.ok(v, `measurement ${id}`);
    assert.equal(v.childId, m.childId);
  }
  for (const d of docs(ds, "growth_assessments")) assert.equal(meas.get(d.data.measurementId)?.childId, d.data.childId);
  for (const d of docs(ds, "ai_summaries")) assert.equal(visits.get(d.data.visitId)?.childId, d.data.childId);
  for (const c of ["immunization_events", "supplement_events", "development_screenings"]) {
    for (const d of docs(ds, c)) {
      assert.ok(children.has(d.data.childId), `${c}/${d.id}`);
      if (d.data.visitId) assert.equal(visits.get(d.data.visitId)?.childId, d.data.childId, `${c}/${d.id}`);
    }
  }
  for (const d of docs(ds, "child_guardians")) {
    assert.ok(children.has(d.data.childId) && guardians.has(d.data.guardianId));
    assert.equal(guardians.get(d.data.guardianId)?.userId ?? null, d.data.guardianUid);
    if (d.data.consentRecordId) assert.ok(consents.has(d.data.consentRecordId));
  }
  for (const d of docs(ds, "correction_requests")) {
    const v = visits.get(d.data.visitId);
    assert.ok(v);
    assert.equal(v.guardianUid, d.data.requestedBy, "API only lets the visit's guardian request a correction");
  }
  for (const [, child] of children) for (const uid of child.guardianUids) {
    assert.ok(parents(2).some(p => p.uid === uid));
  }
});

test("measurements match the real validator, age calculation and growth engine", () => {
  const ds = build(3);
  const children = byId(ds, "children"), visits = byId(ds, "visits");
  const meas = byId(ds, "anthropometry_measurements");
  for (const [id, m] of meas) {
    const visit = visits.get(m.visitId)!, child = children.get(m.childId)!;
    const age = calculateAgeMonths(child.dateOfBirth, visit.visitDate);
    assert.equal(m.ageMonths, age, id);
    assert.equal(m.sex, child.sex);
    const expected = validateAnthropometry({ ageMonths: age, weightKg: m.weightKg, lengthHeightCm: m.lengthHeightCm, measurementType: m.measurementType }).qualityFlags;
    const withCorrection = m.supersedesMeasurementId ? [...expected, "CORRECTED_REQUIRES_REVERIFICATION"] : expected;
    assert.deepEqual(m.qualityFlags, withCorrection, id);
    assert.ok(m.weightKg > 0 && m.lengthHeightCm > 30);
  }
  for (const d of docs(ds, "growth_assessments")) {
    const m = meas.get(d.data.measurementId)!;
    const real = calculateGrowthIndicators({ ageMonths: m.ageMonths, sex: m.sex, weightKg: m.weightKg, lengthHeightCm: m.lengthHeightCm, qualityFlags: m.qualityFlags })
      .find(r => r.indicator === d.data.indicator)!;
    assert.equal(d.data.zScore, null, "Z-scores must never be invented");
    for (const key of ["classificationCode", "referenceStandard", "referenceVersion", "calculationEngineVersion", "needsVerification"] as const) {
      assert.equal(d.data[key], real[key], `${d.id}.${key}`);
    }
    assert.equal(d.data.reviewStatus, "needs_reference_validation");
  }
});

test("visit lifecycle is consistent: one active measurement, verified visits have assessments", () => {
  const ds = build(2);
  const meas = docs(ds, "anthropometry_measurements").map((d): Record<string, any> => ({ id: d.id, ...d.data }));
  const assessments = docs(ds, "growth_assessments").map(d => d.data);
  for (const { id: visitId, data: v } of docs(ds, "visits")) {
    const all = meas.filter(m => m.visitId === visitId);
    const active = all.filter(m => !m.supersededAt);
    assert.equal(active.length, 1, `${visitId} must have exactly one active measurement`);
    for (const old of all.filter(m => m.supersededAt)) {
      const next = meas.find(m => m.id === old.supersededBy)!;
      assert.equal(next.supersedesMeasurementId, old.id);
      assert.equal(next.version, 3);
    }
    assert.equal(active[0].verificationStatus, v.verificationStatus === "verified" ? "verified" : v.verificationStatus);
    if (v.verificationStatus === "verified") {
      assert.ok(v.verifiedBy && v.verifiedAt && v.version >= 2, visitId);
      assert.equal(assessments.filter(a => a.measurementId === active[0].id).length, 3, visitId);
    }
    if (v.verificationStatus === "needs_correction") assert.ok(v.rejectionReason.length >= 5 && v.rejectedBy && v.rejectedAt);
    if (v.verificationStatus === "pending_verification") assert.ok(!v.verifiedAt || v.correctionReason);
    assert.ok(v.visitDate <= "2026-11-26" && v.createdAt <= NOW.toISOString() && v.updatedAt <= NOW.toISOString());
  }
});

test("AI summaries have valid provenance, respect consent and pass the safety rules when marked passed", () => {
  const ds = build(3);
  const consents = docs(ds, "consent_records").map(d => d.data);
  const visits = byId(ds, "visits");
  const knowledge = byId(ds, "knowledge_documents");
  assert.ok(docs(ds, "ai_summaries").length > 0);
  for (const { id, data: s } of docs(ds, "ai_summaries")) {
    assert.ok(validateSummaryProvenance({
      visitId: s.visitId, childId: s.childId, inputRecordVersion: s.inputRecordVersion, generatedAt: s.generatedAt,
      modelProvider: s.modelProvider, modelVersion: s.modelVersion, promptVersion: s.promptVersion,
      knowledgeSourceIds: s.knowledgeSourceIds, safetyStatus: s.safetyStatus,
    }), id);
    assert.equal(visits.get(s.visitId)?.verificationStatus, "verified", `${id} must summarise a verified visit`);
    assert.equal(s.inputRecordVersion, visits.get(s.visitId)!.version);
    assert.equal(s.guardianUid, visits.get(s.visitId)!.guardianUid);
    if (s.safetyStatus === "passed") {
      assert.equal(checkAiSummarySafety(s.generatedText, s.knowledgeSourceIds.length > 0).passed, true, id);
      for (const kid of s.knowledgeSourceIds) assert.equal(knowledge.get(kid)?.status, "approved");
    } else {
      assert.equal(s.modelProvider, "deterministic-fallback");
      assert.ok(s.generatedText.startsWith("Pada kunjungan tanggal"));
    }
    const mine = consents.filter(c => c.childId === s.childId).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    assert.ok(!mine.some(c => c.consentStatus === "declined"), `${id}: no summaries for a declined child`);
    const withdrawn = mine.find(c => c.consentStatus === "withdrawn");
    if (withdrawn) assert.ok(s.generatedAt < withdrawn.capturedAt, `${id}: generated after consent withdrawal`);
  }
  assert.equal(
    buildFallbackSummary({ visit_date: "2026-01-01", weight_kg: 7.5, length_height_cm: 67.5, previous_weight_kg: 7.0 }).includes("berubah 0.5 kg"), true);
});

test("each role has something to look at (queues and states are populated)", () => {
  const ds = build(2);
  const count = (c: string, pred: (d: Record<string, any>) => boolean) => docs(ds, c).filter(d => pred(d.data)).length;
  const today = ds.today;
  assert.ok(count("visits", v => v.verificationStatus === "pending_verification") >= 2, "health worker queue");
  assert.ok(count("visits", v => v.verificationStatus === "needs_correction") >= 1, "cadre follow-up");
  assert.ok(count("visits", v => v.visitDate === today) >= 1, "cadre: visits today");
  assert.ok(count("anthropometry_measurements", m => m.qualityFlags.length > 0 && m.verificationStatus === "pending_verification") >= 1, "quality flag shown in queue");
  for (const c of ["immunization_events", "supplement_events"]) {
    for (const status of ["verified", "pending_verification", "rejected"]) assert.ok(count(c, e => e.verificationStatus === status) >= 1, `${c} ${status}`);
  }
  for (const status of ["pending_review", "accepted_pending_correction", "rejected", "corrected"]) {
    assert.ok(count("correction_requests", r => r.status === status) >= 1, `correction ${status}`);
  }
  for (const type of ["activity", "attendance", "minutes", "home_visit", "inventory"]) assert.ok(count("administrative_records", r => r.type === type) >= 1, type);
  for (const status of ["granted", "withdrawn", "declined"]) assert.ok(count("consent_records", r => r.consentStatus === status) >= 1, `consent ${status}`);
  for (const status of ["approved", "pending_review"]) assert.ok(count("knowledge_documents", d => d.status === status) >= 1, `knowledge ${status}`);
  for (const status of ["published", "draft", "deprecated"]) assert.ok(count("education_content", d => d.status === status) >= 1, `education ${status}`);
  for (const status of ["approved", "draft", "retired"]) assert.ok(count("immunization_schedule_rules", d => d.status === status) >= 1, `rule ${status}`);
  for (const status of ["active", "archived", "needs_verification"]) assert.ok(count("children", c => c.recordStatus === status) >= 1, `child ${status}`);
  const actions = new Set(docs(ds, "audit_logs").map(d => d.data.action));
  for (const a of ["VERIFY_VISIT", "REJECT_VISIT_VERIFICATION", "CORRECT_VISIT_DATA", "VERIFY_SERVICE_EVENT", "REJECT_SERVICE_EVENT",
    "REVIEW_CORRECTION_REQUEST", "CREATE_ADMINISTRATIVE_RECORD", "EXPORT_AGGREGATE_REPORT"]) assert.ok(actions.has(a), a);
  const logs = docs(ds, "audit_logs").map(d => d.data);
  for (const l of logs) assert.ok(l.actorUserId && l.resourceType && l.resourceId && l.reason && l.timestamp <= NOW.toISOString());
  assert.deepEqual(logs.map(l => l.timestamp), [...logs.map(l => l.timestamp)].sort());
});

test("approved reference data is usable by the app; --draft-reference-only keeps it unapproved", () => {
  const ds = build(2);
  const rules = docs(ds, "immunization_schedule_rules").map(d => ({ id: d.id, ...d.data }) as unknown as ApprovedScheduleRule);
  const usable = rules.filter(isScheduleRuleUsable);
  assert.ok(usable.length >= 5);
  assert.ok(usable.every(r => r.officialSource.includes("DEMO") && r.name.startsWith("[DEMO]")));
  const children = docs(ds, "children").map((d): Record<string, any> => ({ id: d.id, ...d.data }));
  const infant = children.find(c => c.registrationNumber === "DEMO-001")!;
  const age = calculateAgeMonths(infant.dateOfBirth, ds.today);
  const recorded = docs(ds, "immunization_events").filter(d => d.data.childId === infant.id && d.data.verificationStatus === "verified").map(d => d.data.vaccineCode);
  assert.ok(getApprovedUpcomingRules(rules, age, recorded).length >= 1, "parent of the youngest child sees upcoming demo rules");
  for (const d of docs(ds, "knowledge_documents").filter(d => d.data.status === "approved")) {
    assert.ok(d.data.sourceTitle && d.data.reviewedAt && d.data.reviewedBy, "approved docs are retrievable by the AI retriever");
  }

  const draft = build(2, { approveReference: false });
  assert.equal(docs(draft, "immunization_schedule_rules").filter(d => d.data.status === "approved").length, 0);
  assert.equal(docs(draft, "knowledge_documents").filter(d => d.data.status === "approved").length, 0);
  assert.equal(docs(draft, "ai_summaries").filter(d => d.data.knowledgeSourceIds.length > 0).length, 0);
});

test("parents are linked to children according to the number of parent accounts", () => {
  for (const n of [0, 1, 2, 3, 5]) {
    const ds = build(n);
    const children = docs(ds, "children").map(d => d.data);
    assert.equal(children.length, 8);
    for (const p of parents(n)) {
      const own = children.filter(c => c.guardianUids.includes(p.uid));
      assert.ok(own.length >= 1 && own.length <= 4, `parent ${p.uid} sees ${own.length} children (n=${n})`);
    }
    assert.equal(children.find(c => c.registrationNumber === "DEMO-008")!.guardianUids.length, 0, "archived child has no parent login");
    assert.equal(docs(ds, "consent_records").length > 0, n > 0);
    assert.equal(new Set(children.map(c => c.registrationNumber)).size, children.length);
    for (const c of children) assert.ok(c.dateOfBirth <= ds.today);
  }
  assert.ok(build(2).collections.children.some((c: Doc) => c.data.guardianUids.length === 2), "one child is shared by two guardians");
});

test("missing staff roles fall back to placeholder ids instead of failing", () => {
  const ds = buildDemoDataset({ posyanduId: "tenant-a", now: NOW, actors: { parents: parents(1) } });
  assert.ok(ds.total > 0);
  assert.ok(docs(ds, "visits").every(v => v.data.recordedBy === "demo-missing-cadre"));
  assert.throws(() => buildDemoDataset({ posyanduId: " " }), /posyanduId/);
});

test("encrypted guardian contacts are readable by the application's decryptField", () => {
  const previous = process.env.FIELD_ENCRYPTION_KEY;
  process.env.FIELD_ENCRYPTION_KEY = KEY;
  try {
    const ds = build(1, { encrypt: createEncryptor(KEY) });
    const encrypted = docs(ds, "guardians").filter(g => g.data.contactEncrypted);
    assert.equal(encrypted.length, docs(ds, "guardians").length);
    for (const g of encrypted) assert.match(decryptField(g.data.contactEncrypted), /^DEMO-KONTAK-/);
    assert.equal(createEncryptor("bukan-hex"), null);
    assert.ok(docs(build(1), "guardians").every(g => g.data.contactEncrypted === null));
  } finally {
    if (previous === undefined) delete process.env.FIELD_ENCRYPTION_KEY; else process.env.FIELD_ENCRYPTION_KEY = previous;
  }
});
