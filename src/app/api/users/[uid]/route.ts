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
  const now = new Date().toISOString();
  const membershipUpdates: Record<string, unknown> = { updatedAt: now };
  const accountUpdates: { displayName?: string; email?: string; disabled?: boolean } = {};

  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "inactive") return NextResponse.json({ error: "Status membership tidak valid" }, { status: 400 });
    if (uid === auth.uid) return NextResponse.json({ error: "Tidak dapat mengubah status membership sendiri" }, { status: 403 });
    membershipUpdates.status = body.status;
  }
  if (body.role !== undefined) {
    if (!["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer"].includes(body.role)) return NextResponse.json({ error: "Role membership tidak valid" }, { status: 400 });
    if (uid === auth.uid) return NextResponse.json({ error: "Tidak dapat mengubah role membership sendiri" }, { status: 403 });
    membershipUpdates.role = body.role;
  }

  // Global Firebase account changes can affect every tenant using this account.
  const hasGlobalAccountChanges = body.email !== undefined || body.disabled !== undefined || body.displayName !== undefined;
  if (hasGlobalAccountChanges && auth.role !== "system_admin") {
    return NextResponse.json({ error: "Perubahan akun global hanya dapat dilakukan system_admin" }, { status: 403 });
  }
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || !body.displayName.trim()) return NextResponse.json({ error: "Nama pengguna tidak valid" }, { status: 400 });
    accountUpdates.displayName = body.displayName.trim();
  }
  if (body.email !== undefined) {
    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    accountUpdates.email = body.email.trim().toLowerCase();
  }
  if (body.disabled !== undefined) {
    if (typeof body.disabled !== "boolean") return NextResponse.json({ error: "Status akun tidak valid" }, { status: 400 });
    accountUpdates.disabled = body.disabled;
  }

  if (Object.keys(membershipUpdates).length > 1) await membershipRef.update(membershipUpdates);
  if (Object.keys(accountUpdates).length) {
    await adminAuth.updateUser(uid, accountUpdates);
    await adminDb.collection("users").doc(uid).set({ ...accountUpdates, updatedAt: now }, { merge: true });
  }
  return NextResponse.json({ success: true });
}
