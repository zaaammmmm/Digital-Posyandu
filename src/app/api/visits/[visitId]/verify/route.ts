import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { calculateGrowthIndicators } from "@/lib/growth/growth-engine";
import { generateSafeSummary } from "@/lib/ai/summary-generator";
import { buildSafeAiPayload } from "@/lib/ai/payload-builder";
import { retrieveApprovedKnowledge } from "@/lib/ai/knowledge-base";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function POST(req: NextRequest, context: { params: Promise<{ visitId: string }> }) {
  const auth = await requireAuth(req, ["health_worker", "posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  try {
    const { visitId } = await context.params;
    const visitRef = adminDb.collection("visits").doc(visitId);
    const visitSnap = await visitRef.get();
    if (!visitSnap.exists || visitSnap.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
    const visit = visitSnap.data()!;
    if (visit.verificationStatus !== "pending_verification") return NextResponse.json({ error: "Hanya kunjungan menunggu verifikasi yang dapat diproses" }, { status: 409 });
    const measSnap = await adminDb.collection("anthropometry_measurements").where("visitId", "==", visitId).get();
    const measDoc = measSnap.docs
      .filter(doc => !doc.data().supersededAt)
      .sort((a, b) => String(b.data().measuredAt || "").localeCompare(String(a.data().measuredAt || "")))[0];
    if (!measDoc) return NextResponse.json({ error: "Pengukuran aktif tidak ditemukan" }, { status: 400 });
    const meas = measDoc.data();
    const assessments = calculateGrowthIndicators({
      ageMonths: Number(meas.ageMonths), sex: meas.sex === "female" ? "female" : "male",
      weightKg: Number(meas.weightKg), lengthHeightCm: Number(meas.lengthHeightCm),
      qualityFlags: Array.isArray(meas.qualityFlags) ? meas.qualityFlags : [],
    });
    const now = new Date().toISOString();
    const nextVersion = (visit.version || 1) + 1;
    await adminDb.runTransaction(async tx => {
      tx.update(visitRef, { verificationStatus: "verified", verifiedBy: auth.uid, verifiedAt: now, version: nextVersion, updatedAt: now });
      tx.update(measDoc.ref, { verificationStatus: "verified", updatedAt: now });
      for (const a of assessments) {
        const ref = adminDb.collection("growth_assessments").doc();
        tx.set(ref, { ...a, measurementId: measDoc.id, childId: visit.childId,
          posyanduId: auth.posyanduId, guardianUid: visit.guardianUid || null,
          reviewStatus: "needs_reference_validation", calculatedAt: now });
      }
    });
    await writeAuditLog({ actorUserId: auth.uid, action: "VERIFY_VISIT", resourceType: "visit",
      resourceId: visitId, beforeSnapshot: visit, afterSnapshot: { verificationStatus: "verified", verifiedBy: auth.uid, version: nextVersion }, reason: "Verifikasi oleh petugas berwenang", posyanduId: auth.posyanduId });

    const snippets = await retrieveApprovedKnowledge("pola makan tumbuh kembang edukasi Posyandu", 3);
    const safePayload = buildSafeAiPayload({
      age_months: Number(meas.ageMonths), sex_for_reference: meas.sex,
      visit_date: visit.visitDate,
      measurements: { weight_kg: meas.weightKg, length_height_cm: meas.lengthHeightCm, measurement_type: meas.measurementType },
      previous_measurement: null,
      validated_assessments: assessments.map(a => ({ indicator: a.indicator,
        classification_code: a.classificationCode, reference_version: a.referenceVersion,
        needs_verification: a.needsVerification })),
      verified_services: [], next_approved_reminders: [],
      approved_education_snippets: snippets.map(s => ({
        id: s.id, title: s.title, source_title: s.sourceTitle,
        version: s.version, summary_tip: s.text.slice(0, 600),
      })),
    });
    const aiRes = await generateSafeSummary(safePayload);
    const summaryRef = await adminDb.collection("ai_summaries").add({
      posyanduId: auth.posyanduId, guardianUid: visit.guardianUid || null,
      childId: visit.childId, visitId, inputRecordVersion: nextVersion,
      modelProvider: aiRes.modelProvider, modelVersion: aiRes.modelVersion,
      promptVersion: aiRes.promptVersion, knowledgeSourceIds: snippets.map(s => s.id),
      generatedText: aiRes.text, safetyStatus: aiRes.safetyStatus,
      reviewStatus: "auto_checked", generatedAt: now,
    });
    return NextResponse.json({ success: true, visitId, summaryId: summaryRef.id,
      safetyStatus: aiRes.safetyStatus, knowledgeSources: snippets.length,
      message: "Kunjungan diverifikasi. Penilaian pertumbuhan tetap menunggu referensi WHO tervalidasi." });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal memverifikasi" }, { status: 500 });
  }
}
