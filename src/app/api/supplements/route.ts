import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "health_worker"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  if (![body.childId, body.supplementType, body.administrationDate].every(v => typeof v === "string" && v.trim())) return NextResponse.json({ error: "Data vitamin/suplemen belum lengkap" }, { status: 400 });
  const child = await adminDb.collection("children").doc(body.childId).get();
  if (!child.exists || child.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  const ref = adminDb.collection("supplement_events").doc();
  await ref.set({ posyanduId: auth.posyanduId, childId: body.childId, visitId: body.visitId || null,
    supplementType: body.supplementType, administrationDate: body.administrationDate,
    recordedBy: auth.uid, verificationStatus: "pending_verification", notes: body.notes || null,
    createdAt: new Date().toISOString() });
  return NextResponse.json({ success: true, eventId: ref.id }, { status: 201 });
}
