export interface ImmunizationRule {
  vaccineCode: string;
  targetAgeMonths: number;
  name: string;
  version: string;
}

// Fail closed: the previous sample was incomplete and lacked approval metadata.
// Do not label illustrative dates as an official production schedule.
export const OFFICIAL_IMMUNIZATION_CATALOG: ImmunizationRule[] = [];

export function getUpcomingImmunizations(ageMonths: number, recordedCodes: string[]): ImmunizationRule[] {
  return OFFICIAL_IMMUNIZATION_CATALOG.filter(
    (rule) => !recordedCodes.includes(rule.vaccineCode) && rule.targetAgeMonths >= ageMonths
  );
}
