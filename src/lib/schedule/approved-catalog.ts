export type ApprovedScheduleRule = {
  id: string;
  vaccineCode: string;
  name: string;
  targetAgeMonths: number;
  version: string;
  effectiveFrom: string;
  officialSource: string;
  sourceDocumentVersion: string;
  status: "draft" | "approved" | "retired";
  approvedBy: string | null;
  approvedAt: string | null;
};

export function isScheduleRuleUsable(rule: ApprovedScheduleRule): boolean {
  if (rule.status !== "approved" || !Number.isInteger(rule.targetAgeMonths)
    || rule.targetAgeMonths < 0 || rule.targetAgeMonths > 240) return false;
  if (![rule.id, rule.vaccineCode, rule.name, rule.version, rule.effectiveFrom,
    rule.officialSource, rule.sourceDocumentVersion, rule.approvedBy, rule.approvedAt]
    .every(value => typeof value === "string" && value.trim().length > 0)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rule.effectiveFrom)) return false;
  const effectiveDate = new Date(`${rule.effectiveFrom}T00:00:00.000Z`);
  const approvalDate = new Date(rule.approvedAt!);
  if (Number.isNaN(effectiveDate.getTime()) || effectiveDate.toISOString().slice(0, 10) !== rule.effectiveFrom
    || Number.isNaN(approvalDate.getTime())) return false;
  try { return new URL(rule.officialSource).protocol === "https:"; }
  catch { return false; }
}

export function getApprovedUpcomingRules(
  rules: ApprovedScheduleRule[],
  ageMonths: number,
  recordedCodes: string[],
): ApprovedScheduleRule[] {
  if (!Number.isFinite(ageMonths) || ageMonths < 0) return [];
  return rules.filter(rule => isScheduleRuleUsable(rule)
    && !recordedCodes.includes(rule.vaccineCode)
    && rule.targetAgeMonths >= ageMonths)
    .sort((a, b) => a.targetAgeMonths - b.targetAgeMonths);
}
