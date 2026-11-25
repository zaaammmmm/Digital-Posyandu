const FORBIDDEN_PATTERNS = [
  /\b(diagnosis|mendiagnosis|terdiagnosis)\b/i,
  /\b(anemia|defisiensi zat besi|stunting|wasting|gizi buruk)\b/i,
  /\b(resep|dosis|minum \d+x|tablet|sirup obat|antibiotik)\b/i,
  /\b(hentikan vaksin|tidak usah imunisasi|abaikan bidan)\b/i,
];

export function checkAiSummarySafety(text: string, hasApprovedSources: boolean): {
  passed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!text || text.trim().length < 25) {
    reasons.push("TEXT_EMPTY_OR_TOO_BRIEF");
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push(`FORBIDDEN_CONTENT:${pattern.source}`);
    }
  }

  if (!hasApprovedSources) {
    reasons.push("NO_OFFICIAL_EDUCATION_SOURCE_LINKED");
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

export function buildFallbackSummary(payload: {
  visit_date: string;
  weight_kg: number;
  length_height_cm: number;
  previous_weight_kg?: number | null;
}): string {
  const diffStr =
    typeof payload.previous_weight_kg === "number"
      ? ` Berat badan tercatat berubah ${(payload.weight_kg - payload.previous_weight_kg).toFixed(1)} kg dibandingkan kunjungan sebelumnya.`
      : "";

  return (
    `Pada kunjungan tanggal ${payload.visit_date}, berat badan anak tercatat ${payload.weight_kg} kg ` +
    `dan panjang/tinggi badan ${payload.length_height_cm} cm.${diffStr} ` +
    `Posisi grafik pertumbuhan dihitung berdasarkan standar baku resmi. ` +
    `Catatan ini merupakan sarana pemantauan berkala dan bukan diagnosis medis. ` +
    `Untuk informasi pertumbuhan lebih lanjut, silakan berkonsultasi dengan bidan atau petugas Posyandu.`
  );
}
