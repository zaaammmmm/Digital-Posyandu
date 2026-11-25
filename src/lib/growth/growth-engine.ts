export interface GrowthIndicatorResult {
  indicator: "WAZ" | "LAZ_HAZ" | "WLZ_WHZ";
  zScore: number | null;
  classificationCode: string;
  referenceStandard: string;
  referenceVersion: string;
  calculationEngineVersion: string;
  needsVerification: boolean;
}

/**
 * WHO computation is intentionally fail-closed until an approved LMS/reference
 * dataset is installed and its provenance/golden tests have been reviewed.
 * Never substitute illustrative constant Z-scores for clinical calculations.
 */
export function calculateGrowthIndicators(params: {
  ageMonths: number;
  sex: "male" | "female";
  weightKg: number;
  lengthHeightCm: number;
  qualityFlags: string[];
}): GrowthIndicatorResult[] {
  const meta = {
    referenceStandard: "WHO_CHILD_GROWTH_STANDARDS",
    referenceVersion: "reference-data-not-installed",
    calculationEngineVersion: "deterministic-engine-1.1.0",
  };
  const indicators: GrowthIndicatorResult["indicator"][] = ["WAZ", "LAZ_HAZ", "WLZ_WHZ"];
  return indicators.map((indicator) => ({
    indicator,
    zScore: null,
    classificationCode: params.qualityFlags.length
      ? "MEASUREMENT_NEEDS_VERIFICATION"
      : "REFERENCE_DATA_REQUIRED",
    ...meta,
    needsVerification: true,
  }));
}
