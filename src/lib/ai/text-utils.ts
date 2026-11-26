import { createHash } from "node:crypto";

/** Shared, dependency-free text helpers for retrieval, validation and injection detection. */

const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/g;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** NFKC + strip invisible/control characters + collapse whitespace. Keeps case and diacritics. */
export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFKC").replace(ZERO_WIDTH, "").replace(CONTROL, " ").replace(/[ \t\f\r]+/g, " ")
    .replace(/\n{3,}/g, "\n\n").trim();
}

/** Lower-case, diacritic-free form used for matching only (never shown to users). */
export function foldText(value: unknown): string {
  return cleanText(value).normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

const STOPWORDS = new Set((
  "yang dan di ke dari untuk pada dengan atau adalah ini itu juga akan dapat bisa agar karena sebagai oleh " +
  "dalam saya kami kita anda kamu apa apakah bagaimana mengapa kenapa kapan berapa siapa mana ada tidak " +
  "bukan sudah belum masih lebih sangat saat ketika jika maka para nya lah kah tah pun serta sebuah suatu " +
  "kali tentang terhadap antara hingga sampai bila supaya boleh harus perlu mau ingin tolong mohon bagi satu " +
  "the a an of to and is are for in on with what how why when"
).split(/\s+/));

/** Very light Indonesian stemmer. Applied identically to queries and documents, so only consistency matters. */
export function stem(word: string): string {
  let w = word;
  w = w.replace(/(lah|kah|tah|pun)$/, "");
  w = w.replace(/(nya|ku|mu)$/, "");
  if (w.length > 5) w = w.replace(/(kan|an|i)$/, "");
  if (w.length > 5) {
    // Nasal assimilation: peN-/meN- + vowel-initial stem (penimbangan -> timbang, pemberian -> beri).
    const nasal = w.match(/^(?:pen|men)([aeiou].*)$/);
    const nasalP = w.match(/^(?:pem|mem)([aeiou].*)$/);
    const nasalS = w.match(/^(?:peny|meny)([aeiou].*)$/);
    if (nasal) w = `t${nasal[1]}`;
    else if (nasalP) w = `p${nasalP[1]}`;
    else if (nasalS) w = `s${nasalS[1]}`;
    else w = w.replace(/^(meng|peng|mem|men|me|ber|ter|di|per|pem|pen|pe|ke|se)/, "");
  }
  return w;
}

export function tokenize(value: unknown): string[] {
  return foldText(value).split(/[^a-z0-9]+/).filter(Boolean);
}

/** Stemmed, stop-word-free tokens (length >= 2, or any digit token). */
export function contentTokens(value: unknown): string[] {
  return tokenize(value).filter(t => !STOPWORDS.has(t) && (t.length >= 3 || /\d/.test(t))).map(stem).filter(t => t.length >= 2);
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
