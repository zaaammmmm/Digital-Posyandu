export interface SafeAiPayload {
  age_months: number;
  sex_for_reference: "male" | "female";
  visit_date: string;
  measurements: {
    weight_kg: number;
    length_height_cm: number;
    measurement_type: "recumbent_length" | "standing_height";
  };
  previous_measurement: {
    visit_date: string;
    weight_kg: number;
    length_height_cm: number;
  } | null;
  validated_assessments: Array<{
    indicator: string;
    classification_code: string;
    reference_version: string;
    needs_verification: boolean;
  }>;
  verified_services: string[];
  next_approved_reminders: string[];
  approved_education_snippets: Array<{
    id: string;
    title: string;
    source_title: string;
    version: string;
    summary_tip: string;
  }>;
}

// Menjamin tidak ada PII (nama lengkap, kontak, NIK, alamat lengkap) yang dikirim ke LLM
export function buildSafeAiPayload(input: SafeAiPayload): SafeAiPayload {
  return {
    age_months: input.age_months,
    sex_for_reference: input.sex_for_reference,
    visit_date: input.visit_date,
    measurements: input.measurements,
    previous_measurement: input.previous_measurement,
    validated_assessments: input.validated_assessments,
    verified_services: input.verified_services,
    next_approved_reminders: input.next_approved_reminders,
    approved_education_snippets: input.approved_education_snippets,
  };
}
