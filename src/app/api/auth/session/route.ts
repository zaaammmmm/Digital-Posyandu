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
    const memberships = await adminDb.collection("memberships")
      .where("userId", "==", decoded.uid)
      .where("posyanduId", "==", posyanduId)
      .where("status", "==", "active").limit(1).get();
    if (decoded.role !== "system_admin" && memberships.empty) {
      return NextResponse.json({ error: "Keanggotaan Posyandu tidak aktif" }, { status: 403 });
    }
    const membershipRole = memberships.docs[0]?.data().role;
    const validRoles = ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer"];
    if (decoded.role !== "system_admin" &&
        (typeof membershipRole !== "string" || !validRoles.includes(membershipRole) ||
         (decoded.role && decoded.role !== membershipRole))) {
      return NextResponse.json({ error: "Role akun dan membership tidak sesuai" }, { status: 403 });
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
    const response = NextResponse.json({
      success: true, uid: decoded.uid,
      role: decoded.role === "system_admin" ? "system_admin" : membershipRole, posyanduId,
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
