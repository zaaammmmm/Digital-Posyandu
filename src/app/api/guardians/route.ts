import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { encryptField } from "@/lib/crypto/field-encryption";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "health_worker", "posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const snap = await adminDb.collection("guardians").where("posyanduId", "==", auth.posyanduId).limit(200).get();
  return NextResponse.json({ items: snap.docs.map(d => {
    const v = d.data();
    return { id: d.id, userId: v.userId || null, fullName: v.fullName,
      relationship: v.relationship, createdAt: v.createdAt };
  }) });
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  if (typeof body.fullName !== "string" || !body.fullName.trim()) return NextResponse.json({ error: "Nama wali wajib diisi" }, { status: 400 });
  if (body.userId && typeof body.userId !== "string") return NextResponse.json({ error: "userId tidak valid" }, { status: 400 });
  const ref = adminDb.collection("guardians").doc();
  const now = new Date().toISOString();
  await ref.set({ posyanduId: auth.posyanduId, userId: body.userId || null,
    fullName: body.fullName.trim(), relationship: typeof body.relationship === "string" ? body.relationship : "unknown",
    contactEncrypted: typeof body.contact === "string" && body.contact ? encryptField(body.contact) : null,
    createdBy: auth.uid, createdAt: now, updatedAt: now });
  return NextResponse.json({ success: true, guardianId: ref.id }, { status: 201 });
}
