import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["parent"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  if (typeof body.visitId !== "string" || typeof body.reason !== "string" || body.reason.trim().length < 5) {
    return NextResponse.json({ error: "Kunjungan dan alasan koreksi (minimal 5 karakter) wajib diisi" }, { status: 400 });
  }
  const visit = await adminDb.collection("visits").doc(body.visitId).get();
  if (!visit.exists || visit.data()?.posyanduId !== auth.posyanduId || visit.data()?.guardianUid !== auth.uid) {
    return NextResponse.json({ error: "Tidak berhak mengajukan koreksi untuk kunjungan ini" }, { status: 403 });
  }
  const ref = adminDb.collection("correction_requests").doc();
  await ref.set({ posyanduId: auth.posyanduId, visitId: body.visitId, requestedBy: auth.uid,
    reason: body.reason.trim().slice(0, 2000), status: "pending_review", createdAt: new Date().toISOString() });
  return NextResponse.json({ success: true, requestId: ref.id }, { status: 201 });
}
