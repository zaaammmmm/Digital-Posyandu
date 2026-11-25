export interface ImmunizationRule {
  vaccineCode: string;
  targetAgeMonths: number;
  name: string;
  version: string;
}

export const OFFICIAL_IMMUNIZATION_CATALOG: ImmunizationRule[] = [
  { vaccineCode: "HB0", targetAgeMonths: 0, name: "Hepatitis B0", version: "kemenkes-2024.1" },
  { vaccineCode: "BCG", targetAgeMonths: 1, name: "BCG", version: "kemenkes-2024.1" },
  { vaccineCode: "POLIO1", targetAgeMonths: 1, name: "Polio Tetes 1", version: "kemenkes-2024.1" },
  { vaccineCode: "DPT_HB_HIB1", targetAgeMonths: 2, name: "DPT-HB-Hib 1", version: "kemenkes-2024.1" },
  { vaccineCode: "POLIO2", targetAgeMonths: 2, name: "Polio Tetes 2", version: "kemenkes-2024.1" },
  { vaccineCode: "PCV1", targetAgeMonths: 2, name: "PCV 1", version: "kemenkes-2024.1" },
  { vaccineCode: "MR1", targetAgeMonths: 9, name: "Campak-Rubela (MR) 1", version: "kemenkes-2024.1" },
];

export function getUpcomingImmunizations(ageMonths: number, recordedCodes: string[]): ImmunizationRule[] {
  return OFFICIAL_IMMUNIZATION_CATALOG.filter(
    (rule) => !recordedCodes.includes(rule.vaccineCode) && rule.targetAgeMonths >= ageMonths
  );
}
