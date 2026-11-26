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

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /(?:\+?62|0)8[1-9][0-9\s-]{6,13}/g;
const LONG_ID = /\b\d{12,16}\b/g;

/** Remove common direct identifiers and markup from any free-text source sent to an LLM. */
function safeSourceText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(EMAIL, "[kontak dihapus]").replace(PHONE, "[kontak dihapus]")
    .replace(LONG_ID, "[nomor identitas dihapus]").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function finite(value: number, field: string, min: number, max: number): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`Payload AI tidak valid: ${field}`);
  return value;
}

/** Explicit allow-list: never spread arbitrary Firestore objects into an LLM request. */
export function buildSafeAiPayload(input: SafeAiPayload): SafeAiPayload {
  const sex = input.sex_for_reference;
  const measurementType = input.measurements?.measurement_type;
  if (!["male", "female"].includes(sex) || !["recumbent_length", "standing_height"].includes(measurementType)
      || !/^\d{4}-\d{2}-\d{2}$/.test(input.visit_date)) throw new Error("Payload AI tidak valid: metadata kunjungan");

  const previous = input.previous_measurement && /^\d{4}-\d{2}-\d{2}$/.test(input.previous_measurement.visit_date)
    ? { visit_date: input.previous_measurement.visit_date,
        weight_kg: finite(input.previous_measurement.weight_kg, "previous.weight_kg", 0.1, 100),
        length_height_cm: finite(input.previous_measurement.length_height_cm, "previous.length_height_cm", 20, 250) }
    : null;

  return {
    age_months: finite(input.age_months, "age_months", 0, 60),
    sex_for_reference: sex,
    visit_date: input.visit_date,
    measurements: {
      weight_kg: finite(input.measurements.weight_kg, "weight_kg", 0.1, 100),
      length_height_cm: finite(input.measurements.length_height_cm, "length_height_cm", 20, 250),
      measurement_type: measurementType,
    },
    previous_measurement: previous,
    validated_assessments: (Array.isArray(input.validated_assessments) ? input.validated_assessments : []).slice(0, 3)
      .filter(item => ["WAZ", "LAZ_HAZ", "WLZ_WHZ"].includes(item.indicator))
      .map(item => ({ indicator: item.indicator.slice(0, 20), classification_code: safeSourceText(item.classification_code, 80),
        reference_version: safeSourceText(item.reference_version, 80), needs_verification: item.needs_verification !== false })),
    verified_services: (Array.isArray(input.verified_services) ? input.verified_services : [])
      .slice(0, 20).map(item => safeSourceText(item, 180)).filter(Boolean),
    next_approved_reminders: (Array.isArray(input.next_approved_reminders) ? input.next_approved_reminders : [])
      .slice(0, 10).map(item => safeSourceText(item, 180)).filter(Boolean),
    approved_education_snippets: (Array.isArray(input.approved_education_snippets) ? input.approved_education_snippets : [])
      .slice(0, 3).map(item => ({ id: safeSourceText(item.id, 100), title: safeSourceText(item.title, 160),
        source_title: safeSourceText(item.source_title, 160), version: safeSourceText(item.version, 80),
        summary_tip: safeSourceText(item.summary_tip, 600) }))
      .filter(item => item.id && item.title && item.source_title && item.version && item.summary_tip),
  };
}
