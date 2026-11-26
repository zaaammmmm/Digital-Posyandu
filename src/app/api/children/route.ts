import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["parent", "cadre", "health_worker", "posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  let query = adminDb.collection("children").where("posyanduId", "==", auth.posyanduId);
  if (auth.role === "parent") query = query.where("guardianUids", "array-contains", auth.uid) as typeof query;
  const snap = await query.limit(100).get();
  return NextResponse.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  const { registrationNumber, fullName, dateOfBirth, sex } = body;
  if (![registrationNumber, fullName, dateOfBirth].every(v => typeof v === "string" && v.trim()) ||
      !["male", "female"].includes(sex)) {
    return NextResponse.json({ error: "Nomor registrasi, nama, tanggal lahir, dan jenis kelamin wajib valid" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Number.isNaN(Date.parse(dateOfBirth))) {
    return NextResponse.json({ error: "Tanggal lahir tidak valid" }, { status: 400 });
  }
  const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (dob.toISOString().slice(0, 10) !== dateOfBirth || dob.getTime() > Date.now()) {
    return NextResponse.json({ error: "Tanggal lahir tidak valid atau berada di masa depan" }, { status: 400 });
  }
  const guardians = Array.isArray(body.guardianUids)
    ? [...new Set(body.guardianUids.filter((v: unknown): v is string => typeof v === "string" && v.trim().length > 0))]
    : [];
  if (guardians.length > 20) return NextResponse.json({ error: "Maksimal 20 wali dapat ditautkan" }, { status: 400 });
  const now = new Date().toISOString();
  const ref = adminDb.collection("children").doc();
  try {
    await adminDb.runTransaction(async tx => {
      const duplicateQuery = adminDb.collection("children")
        .where("posyanduId", "==", auth.posyanduId)
        .where("registrationNumber", "==", registrationNumber.trim()).limit(1);
      const duplicate = await tx.get(duplicateQuery);
      if (!duplicate.empty) throw new Error("DUPLICATE_REGISTRATION");
      for (const guardianUid of guardians) {
        const member = await tx.get(adminDb.collection("memberships").doc(`${guardianUid}_${auth.posyanduId}`));
        if (!member.exists || member.data()?.status !== "active" || member.data()?.role !== "parent") {
          throw new Error("GUARDIAN_NOT_ACTIVE_PARENT");
        }
      }
      tx.create(ref, {
        posyanduId: auth.posyanduId, registrationNumber: registrationNumber.trim(),
        fullName: fullName.trim(), dateOfBirth, sex, guardianUids: guardians,
        recordStatus: "active", createdAt: now, updatedAt: now, createdBy: auth.uid,
      });
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "DUPLICATE_REGISTRATION") return NextResponse.json({ error: "Nomor registrasi sudah digunakan pada Posyandu ini" }, { status: 409 });
    if (code === "GUARDIAN_NOT_ACTIVE_PARENT") return NextResponse.json({ error: "Setiap wali harus memiliki membership parent aktif pada Posyandu ini" }, { status: 400 });
    throw error;
  }
  return NextResponse.json({ success: true, childId: ref.id }, { status: 201 });
}
