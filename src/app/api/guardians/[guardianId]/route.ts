import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { encryptField } from "@/lib/crypto/field-encryption";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ guardianId: string }> }) {
  const auth = await requireAuth(req, ["cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const { guardianId } = await ctx.params;
  const ref = adminDb.collection("guardians").doc(guardianId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Wali tidak ditemukan" }, { status: 404 });
  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof body.fullName === "string" && body.fullName.trim()) updates.fullName = body.fullName.trim();
  if (typeof body.relationship === "string") updates.relationship = body.relationship;
  if (typeof body.contact === "string") updates.contactEncrypted = body.contact ? encryptField(body.contact) : null;
  await ref.update(updates);
  return NextResponse.json({ success: true });
}
