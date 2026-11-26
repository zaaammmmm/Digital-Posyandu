import { NextRequest, NextResponse } from "next/server";
import { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Role } from "@/types/verification";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type AuthContext = {
  uid: string; email?: string; role: Role; posyanduId: string;
  membershipId: string; token: DecodedIdToken;
};

const ROLES: Role[] = ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer", "system_admin"];

export async function requireAuth(req: NextRequest, allowedRoles?: Role[]): Promise<AuthContext | NextResponse> {
  try {
    const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    let token: DecodedIdToken;
    let posyanduId: string | undefined;
    if (bearer) {
      token = await adminAuth.verifyIdToken(bearer[1], true);
      posyanduId = req.headers.get("x-posyandu-id")?.trim();
    } else {
      // Browser pages authenticate with the httpOnly session cookie created by /api/auth/session.
      const sessionCookie = req.cookies.get("__session")?.value;
      if (!sessionCookie) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase())) {
        // CSRF defence for cookie-authenticated writes: the Origin must match this host.
        const origin = req.headers.get("origin");
        let originHost = "";
        try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid origin */ }
        if (!originHost || originHost !== req.headers.get("host")) {
          return NextResponse.json({ error: "Origin permintaan tidak diizinkan" }, { status: 403 });
        }
      }
      token = await adminAuth.verifySessionCookie(sessionCookie, true);
      posyanduId = req.cookies.get("active_posyandu")?.value?.trim();
    }
    if (!posyanduId) return NextResponse.json({ error: "Posyandu aktif wajib ditentukan" }, { status: 400 });
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

    // Central guard for every authenticated API mutation. Route-specific limits may
    // remain stricter, but no write endpoint is left without a baseline throttle.
    if (! ["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase())) {
      const rate = await consumeRateLimit({ actorId: token.uid, action: "authenticated-api-write", limit: 120, windowMs: 60_000 });
      if (!rate.allowed) {
        return NextResponse.json({ error: "Terlalu banyak permintaan perubahan. Coba kembali beberapa saat lagi." },
          { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
      }
    }
    return { uid: token.uid, email: token.email, role, posyanduId, membershipId, token };
  } catch {
    return NextResponse.json({ error: "Token tidak valid atau sesi telah dicabut" }, { status: 401 });
  }
}

export function isAuthError(value: AuthContext | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
