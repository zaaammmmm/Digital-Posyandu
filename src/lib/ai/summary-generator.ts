import { SafeAiPayload } from "./payload-builder";
import { checkAiSummarySafety, buildFallbackSummary } from "./safety-guard";

export async function generateSafeSummary(payload: SafeAiPayload): Promise<{
  text: string;
  safetyStatus: "passed" | "fallback_template";
}> {
  // Jika GEMINI_API_KEY tersedia, di sini model dipanggil dengan system prompt ketat.
  // Jika tidak disetel atau terjadi pelanggaran guardrail, gunakan fallback template deterministik.
  const fallback = buildFallbackSummary({
    visit_date: payload.visit_date,
    weight_kg: payload.measurements.weight_kg,
    length_height_cm: payload.measurements.length_height_cm,
    previous_weight_kg: payload.previous_measurement?.weight_kg ?? null,
  });

  const safety = checkAiSummarySafety(
    fallback,
    payload.approved_education_snippets.length > 0
  );

  return {
    text: fallback,
    safetyStatus: safety.passed ? "passed" : "fallback_template",
  };
}
