/**
 * Generic LMS calculation primitives.
 * This is mathematics only, not an approved WHO reference dataset or a clinical
 * classification. Production callers must supply a provenance-verified row.
 */
export type LmsPoint = { l: number; m: number; s: number };

export function calculateLmsZScore(value: number, point: LmsPoint): number | null {
  if (!Number.isFinite(value) || value <= 0
    || !Number.isFinite(point.l)
    || !Number.isFinite(point.m) || point.m <= 0
    || !Number.isFinite(point.s) || point.s <= 0) return null;

  const ratio = value / point.m;
  const z = Math.abs(point.l) < 1e-10
    ? Math.log(ratio) / point.s
    : (Math.pow(ratio, point.l) - 1) / (point.l * point.s);
  return Number.isFinite(z) ? z : null;
}

export type LmsDatasetRow = LmsPoint & {
  indicator: "WAZ" | "LAZ_HAZ" | "WLZ_WHZ";
  sex: "male" | "female";
  measure: "age_months" | "length_height_cm";
  at: number;
};

export function validateLmsDatasetRows(rows: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return { valid: false, errors: ["DATASET_EMPTY_OR_NOT_ARRAY"] };
  }
  const seen = new Set<string>();
  for (const [index, raw] of rows.entries()) {
    if (!raw || typeof raw !== "object") {
      errors.push(`ROW_${index}_NOT_OBJECT`);
      continue;
    }
    const row = raw as Record<string, unknown>;
    if (!["WAZ", "LAZ_HAZ", "WLZ_WHZ"].includes(String(row.indicator))) errors.push(`ROW_${index}_INVALID_INDICATOR`);
    if (!["male", "female"].includes(String(row.sex))) errors.push(`ROW_${index}_INVALID_SEX`);
    if (!["age_months", "length_height_cm"].includes(String(row.measure))) errors.push(`ROW_${index}_INVALID_MEASURE`);
    if ((row.indicator === "WAZ" || row.indicator === "LAZ_HAZ") && row.measure !== "age_months") errors.push(`ROW_${index}_INDICATOR_MEASURE_MISMATCH`);
    if (row.indicator === "WLZ_WHZ" && row.measure !== "length_height_cm") errors.push(`ROW_${index}_INDICATOR_MEASURE_MISMATCH`);
    if (![row.at, row.l, row.m, row.s].every(value => typeof value === "number" && Number.isFinite(value))) errors.push(`ROW_${index}_NON_FINITE_VALUE`);
    if (typeof row.at === "number" && row.at < 0) errors.push(`ROW_${index}_NEGATIVE_COORDINATE`);
    if (typeof row.m === "number" && row.m <= 0) errors.push(`ROW_${index}_INVALID_M`);
    if (typeof row.s === "number" && row.s <= 0) errors.push(`ROW_${index}_INVALID_S`);
    const key = [row.indicator, row.sex, row.measure, row.at].join(":");
    if (seen.has(key)) errors.push(`ROW_${index}_DUPLICATE_COORDINATE`);
    seen.add(key);
  }
  return { valid: errors.length === 0, errors };
}
