import { contentTokens, foldText, cleanText } from "./text-utils.ts";
import { containsDirectIdentifier, containsSecret } from "./pii.ts";
import { detectPromptLeak } from "./prompt-injection.ts";

/**
 * Strict validation of model output. Used for the RAG chatbot (structured JSON + citations)
 * and for visit summaries (numeric grounding, no "not recorded == not done", no stray markup).
 * Anything that fails is NEVER shown: callers fall back to a deterministic template.
 */

/* ------------------------------- shared checks ------------------------------- */

const URL_LIKE = /(https?:\/\/|www\.)\S+/gi;
const MARKUP = /<[^>]+>|```|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\((?!#)[^)]*\)/;

const INDIVIDUAL_DIAGNOSIS: RegExp[] = [
  /\b(anak|bayi|balita|putra|putri|si kecil|buah hati)\w*\s+(anda|kamu|bapak|ibu|saudara)?\s*(pasti|positif|kemungkinan besar|sepertinya|tampaknya|jelas)?\s*(mengalami|menderita|terkena|mengidap|terdiagnosis|didiagnosis|kena)\b/,
  /\b(anda|kamu|bapak|ibu)\s+(pasti|kemungkinan besar)\s+(mengalami|menderita)\b/,
  /\b(diagnosis|diagnosa|didiagnosis|terdiagnosis|mendiagnosis)\s+(anak|bayi|balita)\s+(anda|kamu)\b/,
  /\b(gizi buruk|stunting|wasting|anemia|gizi kurang)\b.{0,25}\b(pada anak anda|anak anda|anak kamu|anaknya)\b/,
];
const DOSAGE: RegExp[] = [
  /\b\d+(?:[.,]\d+)?\s*(mg|mcg|µg|ug|ml|cc|iu|ui|tablet|kapsul|tetes|sendok (?:teh|makan)|sdt|sdm)\b/i,
  /\b(dosis|takaran obat|aturan pakai|resep)\b/,
];
const PRESCRIBING: RegExp[] = [
  /\b(berikan|beri|minumkan|konsumsi|minum|hentikan|mulai|tambah(?:kan)?)\b\s+(?:anak\s+)?(?:\w+\s+){0,2}(obat|antibiotik|parasetamol|paracetamol|ibuprofen|sirup obat|suplemen dosis|vitamin dosis)\b/,
  /\b(hentikan vaksin|tidak usah imunisasi|tidak perlu imunisasi|abaikan bidan|abaikan dokter|abaikan petugas)\b/,
  /\b(pasti sembuh|dipastikan normal|tidak perlu diperiksa|tidak perlu ke dokter|tidak perlu ke puskesmas|tidak perlu konsultasi)\b/,
];

export type ValidationResult = { ok: boolean; reasons: string[] };

function collectReasons(text: string, extra: Array<[string, boolean]> = []): string[] {
  const folded = foldText(text);
  const reasons: string[] = [];
  if (INDIVIDUAL_DIAGNOSIS.some(p => p.test(folded))) reasons.push("INDIVIDUAL_DIAGNOSIS");
  if (DOSAGE.some(p => p.test(folded))) reasons.push("DOSAGE_OR_PRESCRIPTION");
  if (PRESCRIBING.some(p => p.test(folded))) reasons.push("UNSAFE_CLINICAL_INSTRUCTION");
  if (containsDirectIdentifier(text)) reasons.push("POSSIBLE_DIRECT_IDENTIFIER");
  if (containsSecret(text)) reasons.push("SECRET_LEAK");
  if (MARKUP.test(text)) reasons.push("UNEXPECTED_MARKUP");
  for (const [code, hit] of extra) if (hit) reasons.push(code);
  return reasons;
}

/* ------------------------------- RAG chatbot ------------------------------- */

export type RagSource = { marker: string; id: string; title: string; sourceTitle: string; text: string; sourceUrl?: string | null };

export type RagModelOutput = { status: "answered" | "abstain"; answer: string; citations: string[] };

const MAX_ANSWER_CHARS = 1800;

/** Parse and strictly validate the JSON object returned by the model. Unknown keys are rejected. */
export function parseRagModelOutput(raw: unknown): { ok: true; value: RagModelOutput } | { ok: false; reasons: string[] } {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, reasons: ["EMPTY_OUTPUT"] };
  let body = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch {
    const start = body.indexOf("{"), end = body.lastIndexOf("}");
    if (start < 0 || end <= start) return { ok: false, reasons: ["NOT_JSON"] };
    try { parsed = JSON.parse(body.slice(start, end + 1)); } catch { return { ok: false, reasons: ["NOT_JSON"] }; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, reasons: ["BAD_SHAPE"] };
  const obj = parsed as Record<string, unknown>;
  const extraKeys = Object.keys(obj).filter(k => !["status", "answer", "citations"].includes(k));
  if (extraKeys.length) return { ok: false, reasons: ["UNEXPECTED_FIELDS"] };
  if (obj.status !== "answered" && obj.status !== "abstain") return { ok: false, reasons: ["BAD_STATUS"] };
  if (typeof obj.answer !== "string") return { ok: false, reasons: ["BAD_ANSWER_TYPE"] };
  if (!Array.isArray(obj.citations) || !obj.citations.every(c => typeof c === "string") || obj.citations.length > 8) {
    return { ok: false, reasons: ["BAD_CITATIONS_TYPE"] };
  }
  return { ok: true, value: { status: obj.status, answer: obj.answer, citations: obj.citations as string[] } };
}

const MARKER_GROUP = /\[\s*(S\d{1,2}(?:\s*,\s*S\d{1,2})*)\s*\]/g;

export function extractMarkers(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(MARKER_GROUP)) out.push(...m[1].split(",").map(s => s.trim()));
  return out;
}

const stripMarkers = (s: string) => s.replace(MARKER_GROUP, " ").replace(/\s+/g, " ").trim();
const REFERRAL_CUE = /\b(konsultasi|tenaga kesehatan|bidan|petugas|puskesmas|dokter|kader|posyandu)\b/;
const NUMBER = /\d+(?:[.,]\d+)?/g;
const normNumber = (n: string) => n.replace(",", ".");

/** Minimum share of a cited sentence's content terms that must appear in its cited sources. */
export const MIN_SENTENCE_SUPPORT = 0.5;

export function validateRagAnswer(input: {
  output: RagModelOutput; sources: RagSource[]; systemInstruction: string; canary: string;
}): ValidationResult & { answer: string; usedMarkers: string[] } {
  const { output, sources } = input;
  const reasons: string[] = [];
  const answer = cleanText(output.answer);
  const fail = (...r: string[]) => ({ ok: false, reasons: [...new Set([...reasons, ...r])], answer: "", usedMarkers: [] as string[] });

  if (output.status !== "answered") return fail("NOT_ANSWERED");
  if (answer.length < 40 || answer.length > MAX_ANSWER_CHARS) return fail("ANSWER_LENGTH_OUT_OF_BOUNDS");

  const byMarker = new Map(sources.map(s => [s.marker, s]));
  const used = [...new Set(extractMarkers(answer))];
  if (used.length === 0) return fail("NO_CITATION");
  if (used.some(m => !byMarker.has(m))) return fail("UNKNOWN_CITATION_MARKER");
  const declared = [...new Set(output.citations.map(c => c.trim()))];
  if (declared.some(c => !byMarker.has(c))) return fail("UNKNOWN_DECLARED_CITATION");
  if (declared.length !== used.length || declared.some(c => !used.includes(c))) return fail("CITATION_LIST_MISMATCH");

  // URLs are only allowed if they are exactly a source's reviewed URL.
  const allowedUrls = new Set(sources.map(s => s.sourceUrl).filter((u): u is string => !!u));
  for (const url of answer.match(URL_LIKE) || []) if (!allowedUrls.has(url.replace(/[.,;)]+$/, ""))) reasons.push("UNSOURCED_URL");

  reasons.push(...collectReasons(answer.replace(URL_LIKE, " ")));
  if (detectPromptLeak(answer, { canary: input.canary, systemInstruction: input.systemInstruction })) reasons.push("PROMPT_LEAK");

  // Sentence-level grounding.
  const sentences = answer.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const markers = extractMarkers(sentence);
    const plain = stripMarkers(sentence);
    const words = plain.split(/\s+/).filter(Boolean).length;
    if (markers.length === 0) {
      const folded = foldText(plain);
      const isReferralOnly = REFERRAL_CUE.test(folded) && words <= 35 && !plain.match(NUMBER);
      if (words >= 5 && !isReferralOnly) { reasons.push("UNCITED_CLAIM"); break; }
      continue;
    }
    const cited = markers.map(m => byMarker.get(m)!);
    const sourceText = cited.map(s => `${s.title} ${s.text}`).join(" ");
    const sourceTerms = new Set(contentTokens(sourceText));
    const terms = contentTokens(plain);
    if (terms.length >= 3) {
      const supported = terms.filter(t => sourceTerms.has(t)).length / terms.length;
      if (supported < MIN_SENTENCE_SUPPORT) { reasons.push("UNSUPPORTED_CLAIM"); break; }
    }
    const sourceNumbers = new Set((sourceText.match(NUMBER) || []).map(normNumber));
    const unknown = (plain.match(NUMBER) || []).map(normNumber).filter(n => !sourceNumbers.has(n));
    if (unknown.length) { reasons.push("UNSUPPORTED_NUMBER"); break; }
  }

  const unique = [...new Set(reasons)];
  return { ok: unique.length === 0, reasons: unique, answer: unique.length ? "" : answer, usedMarkers: used };
}

/* ------------------------------ visit summaries ------------------------------ */

type SummaryPayloadLike = {
  age_months: number; visit_date: string;
  measurements: { weight_kg: number; length_height_cm: number };
  previous_measurement: { visit_date: string; weight_kg: number; length_height_cm: number } | null;
  validated_assessments: Array<{ reference_version: string; classification_code: string }>;
  verified_services: string[]; next_approved_reminders: string[];
  approved_education_snippets: Array<{ id: string; source_title: string }>;
};

const NOT_RECORDED_EQUALS_NOT_DONE = /\b(belum|tidak|tak)\s+(pernah\s+)?(diimunisasi|imunisasi|mendapat(?:kan)?\s+(?:imunisasi|vitamin|suplemen)|diberi(?:kan)?\s+(?:imunisasi|vitamin|suplemen)|dilakukan|dilayani)\b/;
const ASSERTS_NORMAL = /\b(pertumbuhan|berat badan|tinggi badan|panjang badan|status gizi)\b.{0,40}\b(normal|baik|sehat|sesuai standar|bermasalah|terlambat|kurang|buruk|lebih)\b/;
const EDU_CUE = /\b(menurut|berdasarkan|edukasi|anjuran|disarankan|materi)\b/;

/** Numbers/dates that the model is allowed to mention because they are in the payload (or trivially derived). */
function allowedNumbers(payload: SummaryPayloadLike): Set<string> {
  const allowed = new Set<string>();
  const add = (v: unknown) => { for (const m of String(v).match(NUMBER) || []) allowed.add(normNumber(m)); };
  add(payload.age_months); add(payload.visit_date);
  add(payload.measurements.weight_kg); add(payload.measurements.length_height_cm);
  if (payload.previous_measurement) {
    add(payload.previous_measurement.visit_date); add(payload.previous_measurement.weight_kg);
    add(payload.previous_measurement.length_height_cm);
    add(Math.abs(payload.measurements.weight_kg - payload.previous_measurement.weight_kg).toFixed(1));
    add(Math.abs(payload.measurements.length_height_cm - payload.previous_measurement.length_height_cm).toFixed(1));
  }
  for (const a of payload.validated_assessments) { add(a.reference_version); add(a.classification_code); }
  for (const s of [...payload.verified_services, ...payload.next_approved_reminders]) add(s);
  return allowed;
}

/**
 * Extra grounding checks on top of checkAiSummarySafety():
 * invented numbers, "not recorded == not done", unsupported normal/abnormal claims,
 * stray markup/URLs, and educational claims that name no approved source.
 */
export function validateSummaryGrounding(text: string, payload: SummaryPayloadLike): ValidationResult {
  const reasons: string[] = [];
  const folded = foldText(text);
  const allowed = allowedNumbers(payload);
  const unknown = (text.match(NUMBER) || []).map(normNumber).filter(n => !allowed.has(n));
  // A date such as 2026-11-26 is tokenised into 2026, 11, 26: accept components of allowed dates.
  const dateParts = new Set([payload.visit_date, payload.previous_measurement?.visit_date || ""].flatMap(d => d.split("-").map(p => String(Number(p)))));
  const trulyUnknown = unknown.filter(n => !dateParts.has(String(Number(n))));
  if (trulyUnknown.length) reasons.push("UNSUPPORTED_NUMBER");
  if (NOT_RECORDED_EQUALS_NOT_DONE.test(folded)) reasons.push("NOT_RECORDED_TREATED_AS_NOT_DONE");
  if (ASSERTS_NORMAL.test(folded) && payload.validated_assessments.length === 0) reasons.push("UNSUPPORTED_GROWTH_JUDGEMENT");
  if (URL_LIKE.test(text) || MARKUP.test(text)) reasons.push("UNEXPECTED_MARKUP_OR_URL");
  if (/^\s*[{[]/.test(text)) reasons.push("STRUCTURED_OUTPUT_LEAK");
  if (DOSAGE.some(p => p.test(folded)) || PRESCRIBING.some(p => p.test(folded))) reasons.push("DOSAGE_OR_PRESCRIPTION");
  if (containsSecret(text)) reasons.push("SECRET_LEAK");

  const snippets = payload.approved_education_snippets;
  if (EDU_CUE.test(folded)) {
    const names = snippets.map(s => foldText(s.source_title)).filter(Boolean);
    const citesKnownSource = names.some(n => folded.includes(n));
    if (snippets.length === 0 || !citesKnownSource) reasons.push("EDUCATION_WITHOUT_CITED_SOURCE");
  }
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)] };
}
