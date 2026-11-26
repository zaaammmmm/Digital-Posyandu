import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { calculateGrowthIndicators } from "@/lib/growth/growth-engine";
import { generateSafeSummary } from "@/lib/ai/summary-generator";
import { buildVisitAiPayload, isVisitLike } from "@/lib/ai/visit-payload";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { validateSummaryProvenance } from "@/lib/ai/summary-provenance";
import { isAiSummaryAllowed } from "@/lib/data/consent";

export async function POST(req: NextRequest, context: { params: Promise<{ visitId: string }> }) {
  const auth = await requireAuth(req, ["health_worker"]);
  if (isAuthError(auth)) return auth;
  try {
    const { visitId } = await context.params;
    const visitRef = adminDb.collection("visits").doc(visitId);
    const visitSnap = await visitRef.get();
    const visitData = visitSnap.data();
    if (!visitSnap.exists || visitData?.posyanduId !== auth.posyanduId) {
      return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
    }
    if (!isVisitLike(visitData)) {
      return NextResponse.json({ error: "Data kunjungan tidak lengkap atau tidak valid" }, { status: 422 });
    }
    const visit = visitData;
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
        tx.create(ref, { ...a, measurementId: measDoc.id, childId: visit.childId,
          posyanduId: auth.posyanduId, guardianUid: visit.guardianUid || null,
          reviewStatus: "needs_reference_validation", calculatedAt: now });
      }
      await writeAuditLog({ actorUserId: auth.uid, action: "VERIFY_VISIT", resourceType: "visit",
        resourceId: visitId, beforeSnapshot: { verificationStatus: visit.verificationStatus, version: visit.version || 1 },
        afterSnapshot: { verificationStatus: "verified", verifiedBy: auth.uid, version: nextVersion },
        reason: "Verifikasi oleh petugas berwenang", posyanduId: auth.posyanduId }, tx);
    });

    if (!(await isAiSummaryAllowed(auth.posyanduId, String(visit.childId)))) {
      return NextResponse.json({ success: true, visitId, summaryId: null, knowledgeSources: 0,
        message: "Kunjungan diverifikasi. Ringkasan otomatis tidak dibuat karena wali tidak memberi persetujuan." });
    }

    // Use the same evidence-backed payload builder as manual summary generation.
    const safePayload = await buildVisitAiPayload({ visitId, visit, posyanduId: auth.posyanduId });
    if (!safePayload) {
      return NextResponse.json({ success: true, visitId, summaryId: null,
        message: "Kunjungan diverifikasi, tetapi data pengukuran tidak memenuhi validasi payload ringkasan." });
    }
    const aiRes = await generateSafeSummary(safePayload);
    const generatedAt = new Date().toISOString();
    const provenance = {
      visitId, childId: String(visit.childId), inputRecordVersion: nextVersion,
      generatedAt, modelProvider: aiRes.modelProvider, modelVersion: aiRes.modelVersion,
      promptVersion: aiRes.promptVersion, knowledgeSourceIds: safePayload.approved_education_snippets.map(s => s.id),
      safetyStatus: aiRes.safetyStatus,
    };
    if (!validateSummaryProvenance(provenance)) {
      throw new Error("Metadata provenance ringkasan tidak valid");
    }
    const summaryRef = await adminDb.collection("ai_summaries").add({
      posyanduId: auth.posyanduId, guardianUid: visit.guardianUid || null,
      ...provenance, generatedText: aiRes.text,
      reviewStatus: "auto_checked",
    });
    return NextResponse.json({ success: true, visitId, summaryId: summaryRef.id,
      safetyStatus: aiRes.safetyStatus, knowledgeSources: safePayload.approved_education_snippets.length,
      message: "Kunjungan diverifikasi. Penilaian pertumbuhan tetap menunggu referensi WHO tervalidasi." });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal memverifikasi" }, { status: 500 });
  }
}
