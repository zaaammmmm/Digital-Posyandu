export function calculateAgeMonths(dateOfBirth: string, atDate: string): number {
  const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);
  const at = new Date(`${atDate}T00:00:00.000Z`);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime()) || dob > at) {
    throw new Error("Tanggal lahir atau tanggal pengukuran tidak valid.");
  }
  let months = (at.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
    (at.getUTCMonth() - dob.getUTCMonth());
  if (at.getUTCDate() < dob.getUTCDate()) months -= 1;
  return months;
}
