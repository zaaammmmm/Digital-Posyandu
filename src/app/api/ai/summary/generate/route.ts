import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { generateSafeSummary } from "@/lib/ai/summary-generator";
import { buildSafeAiPayload } from "@/lib/ai/payload-builder";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { isAiSummaryAllowed } from "@/lib/data/consent";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["health_worker"]);
  if (isAuthError(auth)) return auth;
  try {
    const { visitId } = await req.json();
    if (typeof visitId !== "string") return NextResponse.json({ error: "visitId wajib diisi" }, { status: 400 });
    const visitSnap = await adminDb.collection("visits").doc(visitId).get();
    if (!visitSnap.exists || visitSnap.data()?.posyanduId !== auth.posyanduId || visitSnap.data()?.verificationStatus !== "verified") {
      return NextResponse.json({ error: "Ringkasan hanya dapat dibuat dari kunjungan terverifikasi pada tenant aktif" }, { status: 403 });
    }
    const visit = visitSnap.data()!;
    if (!(await isAiSummaryAllowed(auth.posyanduId, String(visit.childId)))) {
      return NextResponse.json({ error: "Wali tidak memberi persetujuan untuk ringkasan otomatis" }, { status: 403 });
    }
    const measurementSnap = await adminDb.collection("anthropometry_measurements")
      .where("visitId", "==", visitId).get();
    const activeVerifiedMeasurement = measurementSnap.docs
      .filter(doc => !doc.data().supersededAt && doc.data().verificationStatus === "verified")
      .sort((a, b) => String(b.data().measuredAt || "").localeCompare(String(a.data().measuredAt || "")))[0];
    if (!activeVerifiedMeasurement) {
      return NextResponse.json({ error: "Pengukuran aktif yang sudah diverifikasi tidak ditemukan" }, { status: 404 });
    }
    const m = activeVerifiedMeasurement.data();
    const payload = buildSafeAiPayload({
      age_months: Number(m.ageMonths), sex_for_reference: m.sex,
      visit_date: visit.visitDate,
      measurements: { weight_kg: m.weightKg, length_height_cm: m.lengthHeightCm, measurement_type: m.measurementType },
      previous_measurement: null,
      validated_assessments: [], verified_services: [], next_approved_reminders: [],
      approved_education_snippets: [],
    });
    const summary = await generateSafeSummary(payload);
    const ref = await adminDb.collection("ai_summaries").add({
      posyanduId: auth.posyanduId, guardianUid: visit.guardianUid || null, childId: visit.childId, visitId,
      inputRecordVersion: visit.version || 1,
      modelProvider: summary.modelProvider, modelVersion: summary.modelVersion,
      promptVersion: summary.promptVersion, knowledgeSourceIds: [],
      generatedText: summary.text, safetyStatus: summary.safetyStatus,
      reviewStatus: "auto_checked", generatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, summaryId: ref.id, summary: summary.text, safetyStatus: summary.safetyStatus });
  } catch {
    return NextResponse.json({ error: "Ringkasan tidak dapat dibuat; gunakan fallback atau hubungi petugas" }, { status: 500 });
  }
}
