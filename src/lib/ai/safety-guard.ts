const FORBIDDEN_PATTERNS = [
  /\b(diagnosis|mendiagnosis|terdiagnosis|diagnosa|didiagnosis)\b/i,
  /\b(anemia|defisiensi zat besi|stunting|wasting|gizi buruk|gizi kurang)\b/i,
  /\b(resep|dosis|takaran obat|antibiotik|parasetamol|ibuprofen|sirup obat|tablet tambah darah)\b/i,
  /\b(minum|berikan|konsumsi|hentikan|mulai)\s+(obat|antibiotik|vitamin dosis|suplemen dosis|vaksin)\b/i,
  /\b(hentikan vaksin|tidak usah imunisasi|abaikan bidan|abaikan dokter)\b/i,
  /\b(pasti sembuh|dipastikan normal|tidak perlu diperiksa|tidak perlu ke dokter)\b/i,
];
const DIRECT_IDENTIFIER_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?62|0)8[1-9][0-9\s-]{6,13}/,
  /\b\d{16}\b/,
];

export function checkAiSummarySafety(text: string, hasApprovedSources: boolean): {
  passed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const normalized = typeof text === "string" ? text.trim() : "";
  if (normalized.length < 25 || normalized.length > 5000) reasons.push("TEXT_EMPTY_OR_OUT_OF_BOUNDS");
  for (const pattern of FORBIDDEN_PATTERNS) if (pattern.test(normalized)) reasons.push("FORBIDDEN_CLINICAL_CONTENT");
  for (const pattern of DIRECT_IDENTIFIER_PATTERNS) if (pattern.test(normalized)) reasons.push("POSSIBLE_DIRECT_IDENTIFIER");
  if (!hasApprovedSources && /\b(menurut|berdasarkan|edukasi|anjuran|disarankan)\b/i.test(normalized)) {
    reasons.push("UNSOURCED_EDUCATIONAL_CLAIM");
  }
  return { passed: reasons.length === 0, reasons: [...new Set(reasons)] };
}

export function buildFallbackSummary(payload: {
  visit_date: string;
  weight_kg: number;
  length_height_cm: number;
  previous_weight_kg?: number | null;
  verified_services?: string[];
  next_approved_reminders?: string[];
}): string {
  const diffStr = typeof payload.previous_weight_kg === "number"
    ? ` Berat badan tercatat berubah ${(payload.weight_kg - payload.previous_weight_kg).toFixed(1)} kg dibandingkan kunjungan sebelumnya.`
    : "";
  const services = payload.verified_services?.length
    ? ` Layanan yang telah tercatat dan diverifikasi: ${payload.verified_services.slice(0, 5).join("; ")}.`
    : " Belum ada layanan terverifikasi tambahan yang disertakan dalam ringkasan ini.";
  const reminders = payload.next_approved_reminders?.length
    ? ` Pengingat dari katalog yang disahkan: ${payload.next_approved_reminders.slice(0, 5).join("; ")}. Jadwal perlu dikonfirmasi kepada petugas.`
    : " Belum ada pengingat berikutnya dari katalog yang disahkan.";
  return (
    `Pada kunjungan tanggal ${payload.visit_date}, berat badan anak tercatat ${payload.weight_kg} kg ` +
    `dan panjang/tinggi badan ${payload.length_height_cm} cm.${diffStr}${services}${reminders} ` +
    `Interpretasi pertumbuhan belum tersedia karena referensi standar tervalidasi belum dikonfigurasi. ` +
    `Catatan ini merupakan sarana pemantauan berkala dan bukan diagnosis medis. ` +
    `Untuk informasi pertumbuhan lebih lanjut, silakan berkonsultasi dengan bidan atau petugas Posyandu.`
  );
}
