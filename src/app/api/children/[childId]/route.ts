import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function GET(req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const auth = await requireAuth(req, ["parent", "cadre", "health_worker", "posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const { childId } = await ctx.params;
  const ref = adminDb.collection("children").doc(childId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.posyanduId !== auth.posyanduId) {
    return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  }
  const child = snap.data()!;
  if (auth.role === "parent" && !(child.guardianUids || []).includes(auth.uid)) {
    return NextResponse.json({ error: "Tidak berhak mengakses profil anak" }, { status: 403 });
  }
  return NextResponse.json({ id: snap.id, ...child });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const auth = await requireAuth(req, ["cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const { childId } = await ctx.params;
  const ref = adminDb.collection("children").doc(childId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  const body = await req.json();
  const allowed = ["fullName", "dateOfBirth", "sex", "recordStatus", "guardianUids"];
  const changes: Record<string, unknown> = {};
  for (const k of allowed) if (body[k] !== undefined) changes[k] = body[k];
  if (!Object.keys(changes).length) return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  changes.updatedAt = new Date().toISOString();
  changes.updatedBy = auth.uid;
  await ref.update(changes);
  return NextResponse.json({ success: true });
}
