import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { validateAnthropometry } from "@/lib/growth/anthropometry-validator";
import { calculateGrowthIndicators } from "@/lib/growth/growth-engine";
import { buildSafeAiPayload } from "@/lib/ai/payload-builder";
import { generateSafeSummary } from "@/lib/ai/summary-generator";
import { writeAuditLog } from "@/lib/audit/audit-logger";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ visitId: string }> }
) {
  try {
    const { visitId } = await context.params;
    const body = await req.json();
    const verifierId: string = body.verifierId;

    if (!verifierId) {
      return NextResponse.json({ error: "verifierId wajib diisi" }, { status: 400 });
    }

    const visitRef = adminDb.collection("visits").doc(visitId);
    const visitSnap = await visitRef.get();

    if (!visitSnap.exists) {
      return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
    }

    const visitData = visitSnap.data()!;
    const beforeSnapshot = { ...visitData };

    const measSnap = await adminDb
      .collection("anthropometry_measurements")
      .where("visitId", "==", visitId)
      .limit(1)
      .get();

    if (measSnap.empty) {
      return NextResponse.json({ error: "Pengukuran antropometri tidak ditemukan" }, { status: 400 });
    }

    const measDoc = measSnap.docs[0];
    const meas = measDoc.data();

    const val = validateAnthropometry({
      ageMonths: Number(body.ageMonths ?? 12),
      weightKg: Number(meas.weightKg),
      lengthHeightCm: Number(meas.lengthHeightCm),
      measurementType: meas.measurementType,
    });

    const assessments = calculateGrowthIndicators({
      ageMonths: Number(body.ageMonths ?? 12),
      sex: body.sex === "female" ? "female" : "male",
      weightKg: Number(meas.weightKg),
      lengthHeightCm: Number(meas.lengthHeightCm),
      qualityFlags: val.qualityFlags,
    });

    const nowIso = new Date().toISOString();
    const nextVersion = (visitData.version ?? 1) + 1;

    await adminDb.runTransaction(async (tx) => {
      tx.update(visitRef, {
        verificationStatus: "verified",
        verifiedBy: verifierId,
        verifiedAt: nowIso,
        version: nextVersion,
        updatedAt: nowIso,
      });

      tx.update(measDoc.ref, {
        verificationStatus: "verified",
        qualityFlags: val.qualityFlags,
        updatedAt: nowIso,
      });

      for (const item of assessments) {
        const assessRef = adminDb.collection("growth_assessments").doc();
        tx.set(assessRef, {
          measurementId: measDoc.id,
          childId: visitData.childId,
          ...item,
          reviewStatus: "verified",
          calculatedAt: nowIso,
        });
      }
    });

    await writeAuditLog({
      actorUserId: verifierId,
      action: "VERIFY_VISIT",
      resourceType: "visit",
      resourceId: visitId,
      beforeSnapshot,
      afterSnapshot: {
        verificationStatus: "verified",
        verifiedBy: verifierId,
        verifiedAt: nowIso,
        version: nextVersion,
      },
      reason: "Verifikasi data kunjungan oleh petugas berwenang",
    });

    // Panggil Safe AI Summary Pipeline
    const safePayload = buildSafeAiPayload({
      age_months: Number(body.ageMonths ?? 12),
      sex_for_reference: body.sex === "female" ? "female" : "male",
      visit_date: String(visitData.visitDate),
      measurements: {
        weight_kg: Number(meas.weightKg),
        length_height_cm: Number(meas.lengthHeightCm),
        measurement_type: meas.measurementType,
      },
      previous_measurement: body.previousMeasurement ?? null,
      validated_assessments: assessments.map((a) => ({
        indicator: a.indicator,
        classification_code: a.classificationCode,
        reference_version: a.referenceVersion,
        needs_verification: a.needsVerification,
      })),
      verified_services: body.verifiedServices ?? ["Pemberian Vitamin A"],
      next_approved_reminders: body.nextApprovedReminders ?? ["Imunisasi Campak Lanjutan"],
      approved_education_snippets: [
        {
          id: "edu-gizi-1",
          title: "Pola Makan Bergizi Seimbang",
          source_title: "Buku KIA Kemenkes RI",
          version: "2024",
          summary_tip: "Berikan makanan beragam kaya protein hewani sesuai usia.",
        },
      ],
    });

    const aiRes = await generateSafeSummary(safePayload);

    const summaryRef = await adminDb.collection("ai_summaries").add({
      childId: visitData.childId,
      visitId,
      inputRecordVersion: nextVersion,
      modelProvider: "safe-deterministic-pipeline",
      modelVersion: "1.0.0",
      promptVersion: "safety-v1",
      knowledgeSourceIds: ["edu-gizi-1"],
      generatedText: aiRes.text,
      safetyStatus: aiRes.safetyStatus,
      reviewStatus: "auto_checked",
      generatedAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      visitId,
      summaryId: summaryRef.id,
      safetyStatus: aiRes.safetyStatus,
      message: "Data kunjungan diverifikasi dan ringkasan aman telah dibuat.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
