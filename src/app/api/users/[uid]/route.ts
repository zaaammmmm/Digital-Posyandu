import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const { uid } = await ctx.params;
  const membershipRef = adminDb.collection("memberships").doc(`${uid}_${auth.posyanduId}`);
  const membership = await membershipRef.get();
  if (!membership.exists) return NextResponse.json({ error: "Pengguna bukan anggota tenant ini" }, { status: 404 });
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.displayName === "string") updates.displayName = body.displayName.trim();
  if (typeof body.email === "string") updates.email = body.email.trim().toLowerCase();
  if (typeof body.disabled === "boolean") updates.disabled = body.disabled;
  if (body.status === "active" || body.status === "inactive") {
    await membershipRef.update({ status: body.status, updatedAt: new Date().toISOString() });
  }
  if (body.role && ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer"].includes(body.role)) {
    await membershipRef.update({ role: body.role, updatedAt: new Date().toISOString() });
  }
  if (Object.keys(updates).length) {
    await adminAuth.updateUser(uid, updates as { displayName?: string; email?: string; disabled?: boolean });
    await adminDb.collection("users").doc(uid).set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
  }
  return NextResponse.json({ success: true });
}
