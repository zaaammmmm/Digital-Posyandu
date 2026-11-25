import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { Role } from "@/types/verification";

const ASSIGNABLE_ROLES: Role[] = ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const memberships = await adminDb.collection("memberships")
    .where("posyanduId", "==", auth.posyanduId).limit(200).get();
  const items = await Promise.all(memberships.docs.map(async doc => {
    const data = doc.data();
    try {
      const user = await adminAuth.getUser(data.userId);
      return { uid: user.uid, email: user.email || null, displayName: user.displayName || null,
        disabled: user.disabled, role: data.role, status: data.status, membershipId: doc.id };
    } catch { return { uid: data.userId, role: data.role, status: data.status, unavailable: true }; }
  }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  if (typeof body.email !== "string" || typeof body.password !== "string" ||
      body.password.length < 12 || !ASSIGNABLE_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Email, password minimal 12 karakter, dan role valid wajib diisi" }, { status: 400 });
  }
  try {
    const user = await adminAuth.createUser({
      email: body.email.trim().toLowerCase(), password: body.password,
      displayName: typeof body.displayName === "string" ? body.displayName.trim() : undefined,
      disabled: false,
    });
    const now = new Date().toISOString();
    const batch = adminDb.batch();
    batch.set(adminDb.collection("users").doc(user.uid), {
      uid: user.uid, email: user.email, displayName: user.displayName || "",
      accountStatus: "active", createdAt: now, updatedAt: now,
    });
    batch.set(adminDb.collection("memberships").doc(`${user.uid}_${auth.posyanduId}`), {
      userId: user.uid, posyanduId: auth.posyanduId, role: body.role,
      scope: "posyandu", status: "active", createdBy: auth.uid, updatedAt: now,
    });
    await batch.commit();
    return NextResponse.json({ success: true, uid: user.uid }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal membuat pengguna" }, { status: 400 });
  }
}
