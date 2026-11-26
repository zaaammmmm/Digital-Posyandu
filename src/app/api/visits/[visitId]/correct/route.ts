import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { calculateAgeMonths } from "@/lib/growth/age";
import { validateAnthropometry } from "@/lib/growth/anthropometry-validator";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function POST(req: NextRequest, context: { params: Promise<{ visitId: string }> }) {
  const auth = await requireAuth(req, ["health_worker"]);
  if (isAuthError(auth)) return auth;
  const { visitId } = await context.params;
  const body = await req.json();
  if (typeof body.reason !== "string" || body.reason.trim().length < 5 || !body.updatedMeasurements || typeof body.updatedMeasurements !== "object") {
    return NextResponse.json({ error: "Alasan koreksi dan pengukuran baru wajib diisi" }, { status: 400 });
  }
  const visitRef = adminDb.collection("visits").doc(visitId);
  const visitSnap = await visitRef.get();
  if (!visitSnap.exists || visitSnap.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
  const visit = visitSnap.data()!;
  const measurementSnap = await adminDb.collection("anthropometry_measurements").where("visitId", "==", visitId).get();
  const oldDoc = measurementSnap.docs
    .filter(doc => !doc.data().supersededAt)
    .sort((a, b) => String(b.data().measuredAt || "").localeCompare(String(a.data().measuredAt || "")))[0];
  if (!oldDoc) return NextResponse.json({ error: "Pengukuran aktif tidak ditemukan" }, { status: 404 });
  const oldData = oldDoc.data();
  const childSnap = await adminDb.collection("children").doc(String(visit.childId)).get();
  if (!childSnap.exists || childSnap.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Profil anak tidak ditemukan pada tenant aktif" }, { status: 404 });
  const update = body.updatedMeasurements as Record<string, unknown>;
  const weightKg = update.weightKg === undefined ? oldData.weightKg : Number(update.weightKg);
  const lengthHeightCm = update.lengthHeightCm === undefined ? oldData.lengthHeightCm : Number(update.lengthHeightCm);
  const measurementType = update.measurementType === undefined ? oldData.measurementType : update.measurementType;
  if (!Number.isFinite(weightKg) || !Number.isFinite(lengthHeightCm) ||
      !["recumbent_length", "standing_height"].includes(String(measurementType))) {
    return NextResponse.json({ error: "Nilai antropometri koreksi tidak valid" }, { status: 400 });
  }
  const ageMonths = calculateAgeMonths(String(childSnap.data()!.dateOfBirth), visit.visitDate);
  const validation = validateAnthropometry({ ageMonths, weightKg, lengthHeightCm,
    measurementType: measurementType as "recumbent_length" | "standing_height" });
  const now = new Date().toISOString();
  const version = (visit.version || 1) + 1;
  const newRef = adminDb.collection("anthropometry_measurements").doc();
  const newData = { ...oldData, weightKg, lengthHeightCm, measurementType,
    posyanduId: auth.posyanduId, version, supersedesMeasurementId: oldDoc.id,
    ageMonths, sex: childSnap.data()!.sex,
    verificationStatus: "pending_verification",
    qualityFlags: [...validation.qualityFlags, "CORRECTED_REQUIRES_REVERIFICATION"],
    measuredAt: now, recordedBy: auth.uid };
  await adminDb.runTransaction(async tx => {
    tx.update(oldDoc.ref, { supersededAt: now, supersededBy: newRef.id });
    tx.set(newRef, newData);
    tx.update(visitRef, { verificationStatus: "pending_verification", version, updatedAt: now, correctionReason: body.reason.trim() });
  });
  await writeAuditLog({ actorUserId: auth.uid, action: "CORRECT_VISIT_DATA", resourceType: "visit",
    resourceId: visitId, beforeSnapshot: oldData, afterSnapshot: newData, reason: body.reason.trim(), posyanduId: auth.posyanduId });
  return NextResponse.json({ success: true, visitId, measurementVersion: version, status: "pending_verification" });
}
