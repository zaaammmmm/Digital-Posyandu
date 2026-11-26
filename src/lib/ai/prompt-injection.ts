import { cleanText, foldText } from "./text-utils.ts";

/**
 * Prompt-injection detection for (a) user questions and (b) knowledge-base documents.
 *
 * This is a deterministic, auditable first line of defence. It is NOT sufficient alone:
 * the pipeline additionally fences untrusted text with a per-request nonce, asks for a
 * strict JSON schema, validates every citation, and checks the output for leakage.
 */

export type InjectionCode =
  | "IGNORE_INSTRUCTIONS" | "REVEAL_PROMPT" | "ROLE_OVERRIDE" | "JAILBREAK_KEYWORD" | "FAKE_DELIMITER"
  | "SECRET_REQUEST" | "OTHER_USERS_DATA" | "TOOL_OR_CODE_INJECTION" | "OUTPUT_HIJACK" | "ENCODED_PAYLOAD";

export type InjectionScan = { detected: boolean; codes: InjectionCode[] };

const RULES: Array<[InjectionCode, RegExp]> = [
  ["IGNORE_INSTRUCTIONS", /\b(abaikan|lupakan|kesampingkan|langgar|lewati|batalkan|ignore|disregard|forget|override|bypass)\b.{0,60}\b(instruksi|perintah|aturan|petunjuk|batasan|pedoman|sebelumnya|di atas|instructions?|rules?|prompts?|guidelines?|restrictions?|previous|above|prior)\b/],
  ["IGNORE_INSTRUCTIONS", /\b(instruksi|perintah|aturan|instructions?|rules?)\b.{0,30}\b(baru|terbaru|sebenarnya|yang benar|new|real|actual)\b.{0,30}\b(adalah|ialah|is|are|follows?)\b/],
  ["REVEAL_PROMPT", /\b(tampilkan|ungkap|bocorkan|tunjukkan|sebutkan|tulis ulang|ulangi|cetak|bacakan|reveal|show|print|repeat|display|output|leak|dump)\b.{0,60}\b(system prompt|prompt sistem|instruksi sistem|prompt awal|instruksi awal|instruksi rahasia|aturan internal|developer message|hidden (instructions?|prompt)|initial prompt|your (instructions?|prompt|rules))\b/],
  ["REVEAL_PROMPT", /\b(apa|what)\b.{0,20}\b(instruksi|aturan|prompt)\b.{0,20}\b(kamu|anda|mu|your)\b/],
  ["ROLE_OVERRIDE", /\b(kamu|anda|you)\s+(sekarang|kini|are now|must now)\b/],
  ["ROLE_OVERRIDE", /\b(act as|acting as|pretend (to be|you are)|roleplay as|bertindaklah sebagai|berperanlah sebagai|berpura-pura (menjadi|jadi)|pura-pura (menjadi|jadi)|anggap (dirimu|kamu|anda) (sebagai|adalah)|jadilah)\b/],
  ["ROLE_OVERRIDE", /\b(tanpa (batasan|filter|aturan|sensor)|no (restrictions?|filters?|limits?)|unfiltered|uncensored)\b/],
  ["JAILBREAK_KEYWORD", /\b(jailbreak|do anything now|developer mode|mode pengembang|god mode|mode dewa|dan mode|sudo mode)\b/],
  ["FAKE_DELIMITER", /(<\/?\s*(system|assistant|user|model|instructions?|prompt|sumber|source|pertanyaan)\b[^>]{0,40}>|\[\/?(inst|sys|system)\]|<\|[a-z_]{2,20}\|>|<<<|>>>|^\s*#{1,4}\s*(system|instruksi|instructions?)\b|^\s*(system|assistant|developer)\s*:)/m],
  ["SECRET_REQUEST", /\b(api[\s_-]?key|kunci api|private key|kunci privat|service account|akun layanan|secret|rahasia|password|kata sandi|token|credential|kredensial|encryption key|kunci enkripsi|env(ironment)? var(iable)?s?|variabel lingkungan|\.env|firebase admin)\b.{0,50}\b(tampilkan|tunjukkan|berikan|bocorkan|sebutkan|kirim|show|give|print|reveal|leak|send|dump)\b/],
  ["SECRET_REQUEST", /\b(tampilkan|tunjukkan|berikan|bocorkan|sebutkan|kirim|show|give|print|reveal|leak|send|dump)\b.{0,50}\b(api[\s_-]?key|kunci api|private key|kunci privat|service account|password|kata sandi|token|credential|kredensial|kunci enkripsi|encryption key|\.env|environment variables?|variabel lingkungan)\b/],
  ["SECRET_REQUEST", /(field_encryption_key|gemini_api_key|firebase_admin_private_key|firebase_admin_client_email|(^|\s)\.env(\s|$))/],
  ["OTHER_USERS_DATA", /\b(data|catatan|rekam|nama|alamat|nomor|riwayat|record|records|information|info)\b.{0,40}\b(anak lain|pasien lain|semua anak|seluruh anak|semua pasien|orang tua lain|wali lain|pengguna lain|semua pengguna|other (children|patients|users|parents)|all (children|patients|users))\b/],
  ["TOOL_OR_CODE_INJECTION", /(\b(tool_call|function_call|exec\(|eval\(|os\.system|subprocess|rm\s+-rf|drop\s+table|select\s+\*\s+from)\b|<script\b|javascript:|```\s*(bash|sh|python|js|javascript|sql))/],
  ["OUTPUT_HIJACK", /\b(jawab(lah)? (hanya )?dengan|balas(lah)? (hanya )?dengan|respond (only )?with|answer (only )?with|reply (only )?with|mulai(lah)? (jawaban|respons) dengan|start your (answer|response) with)\b.{0,40}\b(ya|iya|ok|oke|yes|setuju|disetujui|approved|aman|pwned)\b/],
];

/** Letters separated by single spaces/dots/dashes ("i g n o r e") are collapsed before scanning. */
function collapseSpacedLetters(text: string): string {
  return text.replace(/\b(?:[a-z][\s.\-_*]){3,}[a-z]\b/g, m => m.replace(/[\s.\-_*]/g, ""));
}

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };
function deLeet(text: string): string {
  // Only convert digits/symbols that sit inside alphabetic words, so real numbers are untouched.
  return text.replace(/\b[a-z0-9@$]{4,}\b/g, w => (/[a-z]/.test(w) ? w.replace(/[013457@$]/g, c => LEET[c] ?? c) : w));
}

/** Variants of the input that the rules are matched against. */
export function normalizeForInjectionScan(input: unknown): string[] {
  const base = foldText(input);
  if (!base) return [];
  const collapsed = collapseSpacedLetters(base);
  const variants = new Set<string>([base, collapsed, deLeet(base), deLeet(collapsed)]);
  return [...variants];
}

export function detectPromptInjection(input: unknown): InjectionScan {
  const codes = new Set<InjectionCode>();
  // Delimiter rule is checked on the raw (cleaned) text so markup characters survive folding.
  const raw = cleanText(input);
  const rawLower = raw.toLowerCase();
  for (const [code, pattern] of RULES) if (code === "FAKE_DELIMITER" && pattern.test(rawLower)) codes.add(code);
  for (const variant of normalizeForInjectionScan(input)) {
    for (const [code, pattern] of RULES) if (code !== "FAKE_DELIMITER" && pattern.test(variant)) codes.add(code);
  }
  if (/[A-Za-z0-9+/=]{80,}/.test(raw.replace(/\s+/g, ""))) codes.add("ENCODED_PAYLOAD");
  return { detected: codes.size > 0, codes: [...codes] };
}

/** Scan every free-text field of a knowledge document. Used on create, approve and retrieval. */
export function scanKnowledgeDocument(doc: { title?: unknown; text?: unknown; sourceTitle?: unknown; keywords?: unknown }): InjectionScan {
  const parts = [doc.title, doc.text, doc.sourceTitle, ...(Array.isArray(doc.keywords) ? doc.keywords : [])];
  const codes = new Set<InjectionCode>();
  for (const part of parts) for (const code of detectPromptInjection(part).codes) codes.add(code);
  // A document legitimately explaining feeding or growth never needs to talk about prompts/instructions to an AI.
  const folded = foldText(parts.filter(p => typeof p === "string").join("\n"));
  if (/\b(system prompt|prompt sistem|language model|large language model|chatbot ini harus|asisten ai harus|ai assistant must|you must)\b/.test(folded)) codes.add("ROLE_OVERRIDE");
  return { detected: codes.size > 0, codes: [...codes] };
}

/** Defang characters/sequences that could forge the prompt's data fences. Applied to retrieved text. */
export function neutralizeUntrustedText(value: unknown, maxLength: number): string {
  return cleanText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/<<<|>>>|```|\[\/?INST\]|<\|[^|]*\|>/gi, " ")
    .replace(/\s+/g, " ").trim().slice(0, maxLength);
}

/* ------------------------------ leakage checks ------------------------------ */

export function makeCanary(randomHex: string): string {
  return `CANARY-${randomHex}`;
}

/** Word-shingles (n words) of a protected text, folded for comparison. */
function shingles(text: string, n: number): Set<string> {
  const words = foldText(text).split(/[^a-z0-9]+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

/**
 * Detects whether model output reproduces protected material: the per-request canary, or
 * >= 1 contiguous run of `n` words copied from the system instruction.
 */
export function detectPromptLeak(output: string, protectedTexts: { canary: string; systemInstruction: string }, n = 7): boolean {
  if (!output) return false;
  if (output.includes(protectedTexts.canary)) return true;
  if (/\bCANARY-[0-9a-f]{8,}\b/i.test(output)) return true;
  const protectedShingles = shingles(protectedTexts.systemInstruction, n);
  const outputShingles = shingles(output, n);
  for (const s of outputShingles) if (protectedShingles.has(s)) return true;
  return false;
}
