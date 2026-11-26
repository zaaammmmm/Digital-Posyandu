import { adminDb } from "@/lib/firebase/admin";
import { buildSafeAiPayload, type SafeAiPayload } from "./payload-builder";
import { retrieveApprovedKnowledge } from "./knowledge-base";
import { getApprovedUpcomingRules } from "@/lib/schedule/approved-catalog";

export type VisitLike = Record<string, unknown> & {
  childId: string;
  visitDate: string;
  version?: number;
  guardianUid?: string | null;
  verificationStatus?: string;
};

/** Validate the minimum persisted visit fields before using Firestore DocumentData. */
export function isVisitLike(value: unknown): value is VisitLike {
  if (!value || typeof value !== "object") return false;
  const visit = value as Record<string, unknown>;
  return typeof visit.childId === "string" && visit.childId.length > 0
    && typeof visit.visitDate === "string" && visit.visitDate.length > 0
    && (visit.version === undefined || (typeof visit.version === "number" && Number.isFinite(visit.version)))
    && (visit.guardianUid === undefined || visit.guardianUid === null || typeof visit.guardianUid === "string")
    && (visit.verificationStatus === undefined || typeof visit.verificationStatus === "string");
}

/** Builds the same privacy-filtered, evidence-backed payload for automatic and manual summaries. */
export async function buildVisitAiPayload(input: {
  visitId: string;
  visit: VisitLike;
  posyanduId: string;
}): Promise<SafeAiPayload | null> {
  const measurementSnap = await adminDb.collection("anthropometry_measurements")
    .where("visitId", "==", input.visitId).get();
  const active = measurementSnap.docs
    .filter(doc => !doc.data().supersededAt && doc.data().verificationStatus === "verified")
    .sort((a, b) => String(b.data().measuredAt || "").localeCompare(String(a.data().measuredAt || "")))[0];
  if (!active) return null;
  const measurement = active.data();
  const ageMonths = Number(measurement.ageMonths);
  const weightKg = Number(measurement.weightKg);
  const lengthHeightCm = Number(measurement.lengthHeightCm);
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || !Number.isFinite(weightKg) || weightKg <= 0
      || !Number.isFinite(lengthHeightCm) || lengthHeightCm <= 0
      || !["male", "female"].includes(measurement.sex)
      || !["recumbent_length", "standing_height"].includes(measurement.measurementType)) return null;

  const [allMeasurements, assessmentsSnap, immunizationsSnap, supplementsSnap, rulesSnap, snippets] = await Promise.all([
    adminDb.collection("anthropometry_measurements").where("childId", "==", input.visit.childId)
      .where("posyanduId", "==", input.posyanduId).where("verificationStatus", "==", "verified").limit(200).get(),
    adminDb.collection("growth_assessments").where("measurementId", "==", active.id).get(),
    adminDb.collection("immunization_events").where("childId", "==", input.visit.childId).limit(100).get(),
    adminDb.collection("supplement_events").where("childId", "==", input.visit.childId).limit(100).get(),
    adminDb.collection("immunization_schedule_rules").where("status", "==", "approved").get(),
    retrieveApprovedKnowledge("pola makan tumbuh kembang edukasi Posyandu", 3),
  ]);

  const previous = allMeasurements.docs
    .filter(doc => !doc.data().supersededAt && doc.id !== active.id
      && String(doc.data().measuredAt || "") < String(measurement.measuredAt || ""))
    .sort((a, b) => String(b.data().measuredAt || "").localeCompare(String(a.data().measuredAt || "")))[0];
  let previousMeasurement: SafeAiPayload["previous_measurement"] = null;
  if (previous) {
    const previousVisit = await adminDb.collection("visits").doc(String(previous.data().visitId)).get();
    const previousDate = previousVisit.data()?.visitDate;
    if (typeof previousDate === "string") {
      const previousWeight = Number(previous.data().weightKg);
      const previousHeight = Number(previous.data().lengthHeightCm);
      if (Number.isFinite(previousWeight) && Number.isFinite(previousHeight)) {
        previousMeasurement = { visit_date: previousDate, weight_kg: previousWeight, length_height_cm: previousHeight };
      }
    }
  }

  const verifiedImmunizations = immunizationsSnap.docs.map(doc => doc.data())
    .filter(item => item.posyanduId === input.posyanduId && item.verificationStatus === "verified");
  const verifiedSupplements = supplementsSnap.docs.map(doc => doc.data())
    .filter(item => item.posyanduId === input.posyanduId && item.verificationStatus === "verified");
  const verifiedServices = [
    ...verifiedImmunizations.map(item => `Imunisasi ${String(item.vaccineCode || "tercatat")} terverifikasi pada ${String(item.administrationDate || "tanggal tidak tersedia")}`),
    ...verifiedSupplements.map(item => `Vitamin/suplemen ${String(item.supplementType || "tercatat")} terverifikasi pada ${String(item.administrationDate || "tanggal tidak tersedia")}`),
  ].slice(0, 20);

  const recordedCodes = verifiedImmunizations.map(item => String(item.vaccineCode || "")).filter(Boolean);
  const approvedRules = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{
    id: string; vaccineCode: string; name: string; targetAgeMonths: number; version: string;
    effectiveFrom: string; officialSource: string; sourceDocumentVersion: string;
    status: "approved"; approvedBy: string | null; approvedAt: string | null;
  }>;
  const reminders = getApprovedUpcomingRules(approvedRules, ageMonths, recordedCodes)
    .slice(0, 10).map(rule => `${rule.name}: target umur ${rule.targetAgeMonths} bulan (katalog ${rule.version})`);

  const validatedAssessments = assessmentsSnap.docs.map(doc => doc.data())
    .filter(item => ["WAZ", "LAZ_HAZ", "WLZ_WHZ"].includes(String(item.indicator)))
    .map(item => ({ indicator: String(item.indicator), classification_code: String(item.classificationCode || "REFERENCE_DATA_REQUIRED"),
      reference_version: String(item.referenceVersion || "unknown"), needs_verification: item.needsVerification !== false }));

  return buildSafeAiPayload({
    age_months: ageMonths,
    sex_for_reference: measurement.sex,
    visit_date: input.visit.visitDate,
    measurements: { weight_kg: weightKg, length_height_cm: lengthHeightCm, measurement_type: measurement.measurementType },
    previous_measurement: previousMeasurement,
    validated_assessments: validatedAssessments,
    verified_services: verifiedServices,
    next_approved_reminders: reminders,
    approved_education_snippets: snippets.map(item => ({ id: item.id, title: item.title,
      source_title: item.sourceTitle, version: item.version, summary_tip: item.text.slice(0, 600) })),
  });
}
