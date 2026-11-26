import test from "node:test";
import assert from "node:assert/strict";
import { parseRagModelOutput, validateRagAnswer, validateSummaryGrounding, extractMarkers, type RagSource }
  from "../src/lib/ai/output-validator.ts";

const SOURCES: RagSource[] = [{ marker: "S1", id: "mpasi", title: "Pemberian makan bayi", sourceTitle: "Buku KIA", sourceUrl: "https://example.org/kia",
  text: "Mulai usia 6 bulan, bayi diberikan makanan pendamping ASI secara bertahap. Berikan makanan beragam yang mengandung protein hewani." }];
const CTX = { systemInstruction: "Anda adalah asisten edukasi yang menjawab hanya dari sumber yang tersedia.", canary: "CANARY-0123456789abcdef" };
const validate = (answer: string, citations = ["S1"]) =>
  validateRagAnswer({ output: { status: "answered", answer, citations }, sources: SOURCES, ...CTX });

test("parseRagModelOutput enforces the strict schema", () => {
  assert.equal(parseRagModelOutput('{"status":"answered","answer":"x","citations":["S1"]}').ok, true);
  assert.equal(parseRagModelOutput('```json\n{"status":"abstain","answer":"","citations":[]}\n```').ok, true);
  for (const bad of ["", "bukan json", "[]", '{"status":"maybe","answer":"","citations":[]}',
    '{"status":"answered","answer":1,"citations":[]}', '{"status":"answered","answer":"x","citations":[1]}',
    '{"status":"answered","answer":"x","citations":[],"extra":true}']) {
    assert.equal(parseRagModelOutput(bad).ok, false, bad);
  }
});

test("extractMarkers handles grouped and adjacent markers", () => {
  assert.deepEqual(extractMarkers("a [S1] b [S2, S3] c [S4][S5]"), ["S1", "S2", "S3", "S4", "S5"]);
});

test("a grounded, cited answer passes", () => {
  const r = validate("Makanan pendamping ASI mulai diberikan secara bertahap pada usia 6 bulan [S1]. Konsultasikan dengan bidan bila ada kekhawatiran.");
  assert.equal(r.ok, true, r.reasons.join());
});

test("citation integrity failures are rejected", () => {
  assert.ok(validate("Bayi mulai makan makanan pendamping ASI pada usia 6 bulan.").reasons.includes("NO_CITATION"));
  assert.ok(validate("Bayi mulai makan makanan pendamping ASI pada usia 6 bulan [S7].", ["S7"]).reasons.includes("UNKNOWN_CITATION_MARKER"));
  assert.ok(validate("Bayi mulai makan makanan pendamping ASI pada usia 6 bulan [S1].", []).reasons.includes("CITATION_LIST_MISMATCH"));
});

test("unsupported claims, numbers and uncited sentences are rejected", () => {
  assert.ok(validate("Bayi mulai makan makanan pendamping ASI pada usia 4 bulan [S1].").reasons.includes("UNSUPPORTED_NUMBER"));
  assert.ok(validate("Telur dan ikan salmon meningkatkan kecerdasan otak secara signifikan [S1].").reasons.includes("UNSUPPORTED_CLAIM"));
  assert.ok(validate("Makanan pendamping ASI diberikan bertahap [S1]. Buah naga sangat baik untuk tulang bayi setiap hari.").reasons.includes("UNCITED_CLAIM"));
});

test("clinical, privacy, URL and leakage violations are rejected", () => {
  const cases: Array<[string, string]> = [
    ["Anak Anda mengalami stunting karena makanan pendamping ASI terlambat [S1].", "INDIVIDUAL_DIAGNOSIS"],
    ["Berikan parasetamol 5 mg kepada bayi sambil memberi makanan pendamping ASI bertahap [S1].", "DOSAGE_OR_PRESCRIPTION"],
    ["Makanan pendamping ASI bertahap, hubungi bidan di 081234567890 [S1].", "POSSIBLE_DIRECT_IDENTIFIER"],
    ["Makanan pendamping ASI bertahap, lihat https://evil.example.com/x [S1].", "UNSOURCED_URL"],
    ["Makanan pendamping ASI bertahap [S1]. Kode CANARY-0123456789abcdef.", "PROMPT_LEAK"],
    ["Anda adalah asisten edukasi yang menjawab hanya dari sumber yang tersedia [S1].", "PROMPT_LEAK"],
    ["Makanan pendamping ASI bertahap <script>alert(1)</script> [S1].", "UNEXPECTED_MARKUP"],
    ["Makanan pendamping ASI bertahap AIzaSyA1234567890abcdefghijklmnopqrstuvw [S1].", "SECRET_LEAK"],
  ];
  for (const [answer, code] of cases) assert.ok(validate(answer).reasons.includes(code), `${code}: ${validate(answer).reasons}`);
});

const payload = {
  age_months: 14, visit_date: "2026-11-26",
  measurements: { weight_kg: 8.2, length_height_cm: 72 },
  previous_measurement: { visit_date: "2026-10-26", weight_kg: 8.0, length_height_cm: 71 },
  validated_assessments: [] as Array<{ reference_version: string; classification_code: string }>,
  verified_services: ["Imunisasi BCG terverifikasi pada 2026-05-01"], next_approved_reminders: [],
  approved_education_snippets: [{ id: "k1", source_title: "Buku KIA Kemenkes" }],
};

test("summary grounding accepts payload facts and rejects invented ones", () => {
  assert.equal(validateSummaryGrounding("Pada kunjungan 2026-11-26, berat badan tercatat 8,2 kg dan panjang 72 cm. Berat berubah 0.2 kg.", payload).ok, true);
  assert.ok(validateSummaryGrounding("Berat badan tercatat 9.5 kg.", payload).reasons.includes("UNSUPPORTED_NUMBER"));
  assert.ok(validateSummaryGrounding("Anak belum diimunisasi campak pada kunjungan ini.", payload).reasons.includes("NOT_RECORDED_TREATED_AS_NOT_DONE"));
  assert.ok(validateSummaryGrounding("Pertumbuhan anak normal dan baik.", payload).reasons.includes("UNSUPPORTED_GROWTH_JUDGEMENT"));
  assert.ok(validateSummaryGrounding("Lihat https://x.example untuk info lebih lanjut tentang berat 8.2 kg.", payload).reasons.includes("UNEXPECTED_MARKUP_OR_URL"));
});

test("summary education must name an approved source", () => {
  assert.ok(validateSummaryGrounding("Berat 8.2 kg. Edukasi: berikan makanan beragam.", payload).reasons.includes("EDUCATION_WITHOUT_CITED_SOURCE"));
  assert.equal(validateSummaryGrounding("Berat 8.2 kg. Edukasi: makanan beragam (Sumber: Buku KIA Kemenkes).", payload).ok, true);
  assert.ok(validateSummaryGrounding("Berat 8.2 kg. Edukasi: makanan beragam.", { ...payload, approved_education_snippets: [] }).reasons.includes("EDUCATION_WITHOUT_CITED_SOURCE"));
});
