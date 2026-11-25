import { NextRequest, NextResponse } from "next/server";
import { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Role } from "@/types/verification";

export type AuthContext = {
  uid: string;
  email?: string;
  role: Role;
  posyanduId: string;
  membershipId: string;
  token: DecodedIdToken;
};

const ROLES: Role[] = [
  "parent", "cadre", "health_worker", "posyandu_admin",
  "content_reviewer", "system_admin",
];

export async function requireAuth(
  req: NextRequest,
  allowedRoles?: Role[]
): Promise<AuthContext | NextResponse> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

  try {
    const token = await adminAuth.verifyIdToken(match[1], true);
    const requestedTenant = req.headers.get("x-posyandu-id");
    if (!requestedTenant) {
      return NextResponse.json({ error: "Header x-posyandu-id wajib diisi" }, { status: 400 });
    }

    const memberships = await adminDb.collection("memberships")
      .where("userId", "==", token.uid)
      .where("posyanduId", "==", requestedTenant)
      .where("status", "==", "active")
      .limit(2).get();

    const membership = memberships.docs.find((doc) => {
      const data = doc.data();
      return ROLES.includes(data.role) &&
        (token.role === "system_admin" || !token.role || token.role === data.role);
    });

    if (!membership && token.role !== "system_admin") {
      return NextResponse.json({ error: "Tidak memiliki keanggotaan aktif pada Posyandu ini" }, { status: 403 });
    }

    const role = token.role === "system_admin"
      ? "system_admin"
      : membership!.data().role as Role;

    if (allowedRoles && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Akses ditolak untuk peran ini" }, { status: 403 });
    }

    return {
      uid: token.uid,
      email: token.email,
      role,
      posyanduId: requestedTenant,
      membershipId: membership?.id || "system",
      token,
    };
  } catch {
    return NextResponse.json({ error: "Token tidak valid atau sesi telah dicabut" }, { status: 401 });
  }
}

export function isAuthError(value: AuthContext | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
