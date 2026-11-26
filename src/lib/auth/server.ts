import { NextRequest, NextResponse } from "next/server";
import { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Role } from "@/types/verification";

export type AuthContext = {
  uid: string; email?: string; role: Role; posyanduId: string;
  membershipId: string; token: DecodedIdToken;
};

const ROLES: Role[] = ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer", "system_admin"];

export async function requireAuth(req: NextRequest, allowedRoles?: Role[]): Promise<AuthContext | NextResponse> {
  const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  try {
    const token = await adminAuth.verifyIdToken(match[1], true);
    const posyanduId = req.headers.get("x-posyandu-id")?.trim();
    if (!posyanduId) return NextResponse.json({ error: "Header x-posyandu-id wajib diisi" }, { status: 400 });
    const membershipId = `${token.uid}_${posyanduId}`;
    const membershipSnap = await adminDb.collection("memberships").doc(membershipId).get();
    if (!membershipSnap.exists) return NextResponse.json({ error: "Keanggotaan Posyandu tidak ditemukan" }, { status: 403 });
    const membership = membershipSnap.data()!;
    if (membership.userId !== token.uid || membership.posyanduId !== posyanduId || membership.status !== "active" || !ROLES.includes(membership.role)) {
      return NextResponse.json({ error: "Keanggotaan Posyandu tidak aktif atau tidak valid" }, { status: 403 });
    }
    // The role is authoritative only in the tenant membership, never in client claims/body.
    const role = membership.role as Role;
    if (allowedRoles && !allowedRoles.includes(role)) return NextResponse.json({ error: "Akses ditolak untuk peran ini" }, { status: 403 });
    const tenant = await adminDb.collection("posyandu").doc(posyanduId).get();
    if (!tenant.exists || tenant.data()?.status !== "active") return NextResponse.json({ error: "Posyandu tidak aktif atau tidak ditemukan" }, { status: 403 });
    return { uid: token.uid, email: token.email, role, posyanduId, membershipId, token };
  } catch {
    return NextResponse.json({ error: "Token tidak valid atau sesi telah dicabut" }, { status: 401 });
  }
}

export function isAuthError(value: AuthContext | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
