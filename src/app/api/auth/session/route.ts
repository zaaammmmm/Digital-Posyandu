import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { idToken, posyanduId } = await req.json();
    if (typeof idToken !== "string" || typeof posyanduId !== "string" || !posyanduId.trim()) {
      return NextResponse.json({ error: "idToken dan posyanduId wajib diisi" }, { status: 400 });
    }
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const membership = await adminDb.collection("memberships").doc(`${decoded.uid}_${posyanduId}`).get();
    if (!membership.exists || membership.data()?.userId !== decoded.uid ||
        membership.data()?.posyanduId !== posyanduId || membership.data()?.status !== "active") {
      return NextResponse.json({ error: "Keanggotaan aktif tidak ditemukan atau tidak valid" }, { status: 403 });
    }
    const membershipRole = membership.data()?.role;
    const validRoles = ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer", "system_admin"];
    if (typeof membershipRole !== "string" || !validRoles.includes(membershipRole)) {
      return NextResponse.json({ error: "Role membership tidak valid" }, { status: 403 });
    }
    const tenant = await adminDb.collection("posyandu").doc(posyanduId).get();
    if (!tenant.exists || tenant.data()?.status !== "active") {
      return NextResponse.json({ error: "Posyandu tidak aktif atau tidak ditemukan" }, { status: 403 });
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
    const response = NextResponse.json({
      success: true, uid: decoded.uid,
      role: membershipRole, posyanduId,
    });
    response.cookies.set("__session", sessionCookie, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: SESSION_DURATION_MS / 1000,
    });
    response.cookies.set("active_posyandu", posyanduId, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: SESSION_DURATION_MS / 1000,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Token autentikasi tidak valid" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("__session", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("active_posyandu", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
