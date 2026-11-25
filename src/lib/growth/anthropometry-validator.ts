export interface AnthropometryInput {
  ageMonths: number;
  weightKg: number;
  lengthHeightCm: number;
  measurementType: "recumbent_length" | "standing_height";
}

export function validateAnthropometry(input: AnthropometryInput) {
  const qualityFlags: string[] = [];

  if (input.weightKg <= 0 || input.weightKg > 60) {
    qualityFlags.push("WEIGHT_OUT_OF_TECHNICAL_RANGE");
  }
  if (input.lengthHeightCm <= 30 || input.lengthHeightCm > 150) {
    qualityFlags.push("LENGTH_HEIGHT_OUT_OF_TECHNICAL_RANGE");
  }
  if (input.ageMonths < 24 && input.measurementType !== "recumbent_length") {
    qualityFlags.push("AGE_UNDER_24M_EXPECTS_RECUMBENT_LENGTH");
  }
  if (input.ageMonths >= 24 && input.measurementType !== "standing_height") {
    qualityFlags.push("AGE_24M_PLUS_EXPECTS_STANDING_HEIGHT");
  }

  return {
    isValid: qualityFlags.length === 0,
    qualityFlags,
  };
}
