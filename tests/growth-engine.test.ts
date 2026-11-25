import test from "node:test";
import assert from "node:assert/strict";
import { calculateGrowthIndicators } from "../src/lib/growth/growth-engine.ts";
import { calculateAgeMonths } from "../src/lib/growth/age.ts";
import { validateAnthropometry } from "../src/lib/growth/anthropometry-validator.ts";

test("WHO assessment does not fabricate z-scores when reference data is absent", () => {
  const result = calculateGrowthIndicators({ ageMonths: 18, sex: "female", weightKg: 10, lengthHeightCm: 78,
    qualityFlags: [] });
  assert.equal(result.length, 3);
  assert.ok(result.every(x => x.zScore === null && x.needsVerification));
});

test("age in months respects day-of-month boundary", () => {
  assert.equal(calculateAgeMonths("2024-01-20", "2024-02-19"), 0);
  assert.equal(calculateAgeMonths("2024-01-20", "2024-02-20"), 1);
});

test("anthropometry flags method inconsistent with age", () => {
  const result = validateAnthropometry({ ageMonths: 18, weightKg: 10, lengthHeightCm: 78,
    measurementType: "standing_height" });
  assert.equal(result.isValid, false);
  assert.ok(result.qualityFlags.includes("AGE_UNDER_24M_EXPECTS_RECUMBENT_LENGTH"));
});
