import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { Role } from "@/types/verification";

const ROLES: Role[] = ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer"];
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const snap = await adminDb.collection("memberships").where("posyanduId", "==", auth.posyanduId).limit(200).get();
  return NextResponse.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  if (typeof body.userId !== "string" || !ROLES.includes(body.role) || !["active", "inactive"].includes(body.status || "active")) {
    return NextResponse.json({ error: "User, role, atau status tidak valid" }, { status: 400 });
  }
  if (body.userId === auth.uid && (body.status === "inactive" || body.role !== auth.role)) {
    return NextResponse.json({ error: "Tidak dapat menonaktifkan atau mengubah peran akun sendiri" }, { status: 400 });
  }
  const user = await adminDb.collection("users").doc(body.userId).get();
  if (!user.exists) return NextResponse.json({ error: "Akun pengguna tidak ditemukan" }, { status: 404 });
  const id = `${body.userId}_${auth.posyanduId}`;
  await adminDb.collection("memberships").doc(id).set({
    userId: body.userId, posyanduId: auth.posyanduId,
    role: body.role, scope: "posyandu", status: body.status || "active",
    createdBy: auth.uid, updatedAt: new Date().toISOString(),
  }, { merge: true });
  return NextResponse.json({ success: true, membershipId: id }, { status: 201 });
}
