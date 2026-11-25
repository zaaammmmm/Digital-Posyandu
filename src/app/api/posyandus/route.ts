import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin", "health_worker"]);
  if (isAuthError(auth)) return auth;
  const snap = await adminDb.collection("posyandus").doc(auth.posyanduId).get();
  if (!snap.exists) return NextResponse.json({ error: "Posyandu tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  const allowed = ["name", "addressArea", "village", "district", "regency", "province", "serviceSchedule", "status"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (body[key] !== undefined) update[key] = body[key];
  if (!Object.keys(update).length) return NextResponse.json({ error: "Tidak ada field yang diperbarui" }, { status: 400 });
  update.updatedAt = new Date().toISOString();
  await adminDb.collection("posyandus").doc(auth.posyanduId).set(update, { merge: true });
  return NextResponse.json({ success: true });
}
