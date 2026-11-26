import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { validateAnthropometry } from "@/lib/growth/anthropometry-validator";
import { calculateAgeMonths } from "@/lib/growth/age";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "health_worker"]);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();
    const { childId, visitDate, measurements, notes } = body;
    if (typeof childId !== "string" || !measurements) return NextResponse.json({ error: "Data kunjungan tidak lengkap" }, { status: 400 });
    const childRef = adminDb.collection("children").doc(childId);
    const childSnap = await childRef.get();
    if (!childSnap.exists || childSnap.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan pada Posyandu aktif" }, { status: 404 });
    const child = childSnap.data()!;
    const date = typeof visitDate === "string" ? visitDate : new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Tanggal kunjungan harus berformat YYYY-MM-DD" }, { status: 400 });
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return NextResponse.json({ error: "Tanggal kunjungan tidak valid" }, { status: 400 });
    if (parsedDate.getTime() > Date.now()) return NextResponse.json({ error: "Tanggal kunjungan tidak boleh berada jauh di masa depan" }, { status: 400 });
    const ageMonths = calculateAgeMonths(child.dateOfBirth, date);
    const weightKg = Number(measurements.weightKg);
    const lengthHeightCm = Number(measurements.lengthHeightCm);
    if (!Number.isFinite(weightKg) || !Number.isFinite(lengthHeightCm) ||
        !["recumbent_length", "standing_height"].includes(measurements.measurementType)) {
      return NextResponse.json({ error: "Pengukuran tidak valid" }, { status: 400 });
    }
    const val = validateAnthropometry({ ageMonths, weightKg, lengthHeightCm, measurementType: measurements.measurementType });
    const optionalMeasurement = (value: unknown, min: number, max: number) => {
      if (value === undefined || value === null || value === "") return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
    };
    const headCircumferenceCm = optionalMeasurement(measurements.headCircumferenceCm, 20, 70);
    const muacCm = optionalMeasurement(measurements.muacCm, 5, 35);
    if (headCircumferenceCm === null || muacCm === null) return NextResponse.json({ error: "Lingkar kepala atau LILA di luar rentang teknis" }, { status: 400 });
    const now = new Date().toISOString();
    const visitRef = adminDb.collection("visits").doc();
    const measRef = adminDb.collection("anthropometry_measurements").doc();
    const batch = adminDb.batch();
    batch.set(visitRef, {
      childId, posyanduId: auth.posyanduId, guardianUid: (child.guardianUids || [])[0] || null,
      visitDate: date, recordedBy: auth.uid, verificationStatus: "pending_verification",
      notes: typeof notes === "string" ? notes.slice(0, 2000) : "",
      version: 1, createdAt: now, updatedAt: now,
    });
    batch.set(measRef, {
      visitId: visitRef.id, childId, posyanduId: auth.posyanduId,
      ageMonths, sex: child.sex, weightKg, lengthHeightCm,
      measurementType: measurements.measurementType,
      ...(headCircumferenceCm !== undefined ? { headCircumferenceCm } : {}),
      ...(muacCm !== undefined ? { muacCm } : {}),
      measurementUnit: { weight: "kg", lengthHeight: "cm", headCircumference: "cm", muac: "cm" },
      measurementMethod: typeof measurements.measurementMethod === "string" ? measurements.measurementMethod.slice(0, 120) : null,
      equipmentId: typeof measurements.equipmentId === "string" ? measurements.equipmentId.slice(0, 80) : null,
      measurementNotes: typeof measurements.notes === "string" ? measurements.notes.slice(0, 500) : null,
      qualityFlags: val.qualityFlags, verificationStatus: "pending_verification",
      measuredAt: now, recordedBy: auth.uid,
    });
    await batch.commit();
    return NextResponse.json({ success: true, visitId: visitRef.id, qualityFlags: val.qualityFlags, status: "pending_verification" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan kunjungan" }, { status: 400 });
  }
}
