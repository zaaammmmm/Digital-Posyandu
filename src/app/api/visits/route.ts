import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { validateAnthropometry } from "@/lib/growth/anthropometry-validator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, posyanduId, visitDate, recordedBy, measurements, notes } = body;

    if (!childId || !posyanduId || !recordedBy || !measurements) {
      return NextResponse.json({ error: "Data kunjungan tidak lengkap" }, { status: 400 });
    }

    const val = validateAnthropometry({
      ageMonths: Number(body.ageMonths ?? 12),
      weightKg: Number(measurements.weightKg),
      lengthHeightCm: Number(measurements.lengthHeightCm),
      measurementType: measurements.measurementType,
    });

    const now = new Date().toISOString();
    const visitRef = adminDb.collection("visits").doc();
    const measRef = adminDb.collection("anthropometry_measurements").doc();

    const batch = adminDb.batch();

    batch.set(visitRef, {
      childId,
      posyanduId,
      visitDate: visitDate || now.slice(0, 10),
      recordedBy,
      verificationStatus: "pending_verification",
      notes: notes || "",
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    batch.set(measRef, {
      visitId: visitRef.id,
      childId,
      weightKg: Number(measurements.weightKg),
      lengthHeightCm: Number(measurements.lengthHeightCm),
      measurementType: measurements.measurementType,
      qualityFlags: val.qualityFlags,
      verificationStatus: "pending_verification",
      measuredAt: now,
      recordedBy,
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      visitId: visitRef.id,
      qualityFlags: val.qualityFlags,
      status: "pending_verification",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
