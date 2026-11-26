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
  return rule.status === "approved"
    && Number.isInteger(rule.targetAgeMonths) && rule.targetAgeMonths >= 0
    && [rule.id, rule.vaccineCode, rule.name, rule.version, rule.effectiveFrom,
      rule.officialSource, rule.sourceDocumentVersion, rule.approvedBy, rule.approvedAt]
      .every(value => typeof value === "string" && value.trim().length > 0);
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
