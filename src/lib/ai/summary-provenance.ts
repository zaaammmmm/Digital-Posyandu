export type SummaryProvenance = {
  visitId: string;
  childId: string;
  inputRecordVersion: number;
  generatedAt: string;
  modelProvider: string;
  modelVersion: string;
  promptVersion: string;
  knowledgeSourceIds: string[];
  safetyStatus: "passed" | "fallback_template";
};

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Docs 04/05 require every AI summary to record provider, model, prompt version,
 * sources, time, and safety status. A summary without complete provenance must
 * not be stored.
 */
export function validateSummaryProvenance(value: SummaryProvenance): boolean {
  if (!value) return false;
  if (![value.visitId, value.childId, value.modelProvider, value.modelVersion, value.promptVersion].every(nonEmpty)) return false;
  if (!Number.isInteger(value.inputRecordVersion) || value.inputRecordVersion < 1) return false;
  if (!nonEmpty(value.generatedAt) || Number.isNaN(Date.parse(value.generatedAt))) return false;
  if (!Array.isArray(value.knowledgeSourceIds) || !value.knowledgeSourceIds.every(nonEmpty)) return false;
  return value.safetyStatus === "passed" || value.safetyStatus === "fallback_template";
}
