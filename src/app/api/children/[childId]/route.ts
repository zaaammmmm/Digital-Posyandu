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
  const changes: Record<string, unknown> = {};
  if (body.fullName !== undefined) {
    if (typeof body.fullName !== "string" || !body.fullName.trim()) return NextResponse.json({ error: "Nama anak tidak valid" }, { status: 400 });
    changes.fullName = body.fullName.trim();
  }
  if (body.dateOfBirth !== undefined) {
    if (typeof body.dateOfBirth !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) return NextResponse.json({ error: "Tanggal lahir tidak valid" }, { status: 400 });
    const date = new Date(`${body.dateOfBirth}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.dateOfBirth || date.getTime() > Date.now()) return NextResponse.json({ error: "Tanggal lahir tidak valid atau berada di masa depan" }, { status: 400 });
    changes.dateOfBirth = body.dateOfBirth;
  }
  if (body.sex !== undefined) {
    if (!["male", "female"].includes(body.sex)) return NextResponse.json({ error: "Jenis kelamin tidak valid" }, { status: 400 });
    changes.sex = body.sex;
  }
  if (body.recordStatus !== undefined) {
    if (!["active", "archived", "needs_verification"].includes(body.recordStatus)) return NextResponse.json({ error: "Status data tidak valid" }, { status: 400 });
    changes.recordStatus = body.recordStatus;
  }
  if (body.guardianUids !== undefined) {
    if (!Array.isArray(body.guardianUids) || body.guardianUids.length > 20 || body.guardianUids.some((v: unknown) => typeof v !== "string" || !v.trim())) return NextResponse.json({ error: "Daftar wali tidak valid" }, { status: 400 });
    const guardianUids = [...new Set(body.guardianUids as string[])];
    const memberships = await Promise.all(guardianUids.map(uid => adminDb.collection("memberships").doc(`${uid}_${auth.posyanduId}`).get()));
    if (memberships.some(m => !m.exists || m.data()?.status !== "active" || m.data()?.role !== "parent")) return NextResponse.json({ error: "Wali harus memiliki membership parent aktif pada tenant ini" }, { status: 400 });
    changes.guardianUids = guardianUids;
  }
  if (!Object.keys(changes).length) return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  changes.updatedAt = new Date().toISOString();
  changes.updatedBy = auth.uid;
  await ref.update(changes);
  return NextResponse.json({ success: true });
}
