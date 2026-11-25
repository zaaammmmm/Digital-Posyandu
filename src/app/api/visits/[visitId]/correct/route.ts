import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit/audit-logger";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ visitId: string }> }
) {
  try {
    const { visitId } = await context.params;
    const body = await req.json();
    const { actorUserId, reason, updatedMeasurements } = body;

    if (!actorUserId || !reason || !updatedMeasurements) {
      return NextResponse.json(
        { error: "actorUserId, reason, dan updatedMeasurements wajib diisi" },
        { status: 400 }
      );
    }

    const visitRef = adminDb.collection("visits").doc(visitId);
    const visitSnap = await visitRef.get();

    if (!visitSnap.exists) {
      return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
    }

    const visitData = visitSnap.data()!;
    const measSnap = await adminDb
      .collection("anthropometry_measurements")
      .where("visitId", "==", visitId)
      .limit(1)
      .get();

    if (measSnap.empty) {
      return NextResponse.json({ error: "Pengukuran tidak ditemukan" }, { status: 404 });
    }

    const measDoc = measSnap.docs[0];
    const oldMeasData = measDoc.data();
    const nowIso = new Date().toISOString();
    const nextVersion = (visitData.version ?? 1) + 1;

    await adminDb.runTransaction(async (tx) => {
      tx.update(visitRef, {
        verificationStatus: "corrected",
        version: nextVersion,
        updatedAt: nowIso,
      });

      tx.update(measDoc.ref, {
        weightKg: Number(updatedMeasurements.weightKg ?? oldMeasData.weightKg),
        lengthHeightCm: Number(updatedMeasurements.lengthHeightCm ?? oldMeasData.lengthHeightCm),
        verificationStatus: "corrected",
        updatedAt: nowIso,
      });
    });

    await writeAuditLog({
      actorUserId,
      action: "CORRECT_VISIT_DATA",
      resourceType: "visit",
      resourceId: visitId,
      beforeSnapshot: oldMeasData,
      afterSnapshot: updatedMeasurements,
      reason,
    });

    return NextResponse.json({
      success: true,
      visitId,
      version: nextVersion,
      message: "Koreksi berhasil dicatat dalam audit trail.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
