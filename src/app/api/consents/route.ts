import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { AI_SUMMARY_NOTICE_VERSION, AI_SUMMARY_PURPOSE } from "@/lib/data/consent";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { consumeRateLimit } from "@/lib/security/rate-limit";


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["parent", "cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId wajib diisi" }, { status: 400 });
  const child = await adminDb.collection("children").doc(childId).get();
  if (!child.exists || child.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  if (auth.role === "parent" && !(child.data()?.guardianUids || []).includes(auth.uid)) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  let query = adminDb.collection("consent_records").where("childId", "==", childId);
  if (auth.role === "parent") query = query.where("guardianUid", "==", auth.uid);
  const snap = await query.limit(100).get();
  return NextResponse.json({ items: snap.docs.map(d => {
    const v = d.data(); return { id: d.id, purpose: v.purpose, noticeVersion: v.noticeVersion,
      consentStatus: v.consentStatus, capturedAt: v.capturedAt, withdrawnAt: v.withdrawnAt };
  }) });
}

export async function POST(req: NextRequest) {
  // Consent must be an explicit action by an authenticated guardian.
  // Staff cannot create a consent record attributed to themselves on a child's behalf.
  const auth = await requireAuth(req, ["parent"]);
  if (isAuthError(auth)) return auth;
  const rate = await consumeRateLimit({ actorId: auth.uid, action: "consent-write", limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Terlalu banyak perubahan persetujuan. Coba kembali beberapa saat lagi." },
    { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = await req.json();
  const { childId, purpose, noticeVersion, consentStatus } = body;
  if (![childId, purpose, noticeVersion].every(v => typeof v === "string" && v.trim()) ||
      !["granted", "withdrawn", "declined"].includes(consentStatus)) {
    return NextResponse.json({ error: "Data persetujuan tidak valid" }, { status: 400 });
  }
  if (!AI_SUMMARY_NOTICE_VERSION || purpose !== AI_SUMMARY_PURPOSE || noticeVersion !== AI_SUMMARY_NOTICE_VERSION) {
    return NextResponse.json({ error: "Pemberitahuan persetujuan AI belum dikonfigurasi atau versinya sudah tidak berlaku. Hubungi administrator Posyandu." }, { status: 409 });
  }
  const childRef = adminDb.collection("children").doc(childId);
  const child = await childRef.get();
  if (!child.exists || child.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  if (!(child.data()?.guardianUids || []).includes(auth.uid)) return NextResponse.json({ error: "Wali tidak berwenang" }, { status: 403 });
  const now = new Date().toISOString();
  const ref = adminDb.collection("consent_records").doc();
  const record = {
    posyanduId: auth.posyanduId, childId, guardianUid: auth.uid, capturedBy: auth.uid,
    purpose, noticeVersion, consentStatus, capturedAt: now,
    withdrawnAt: consentStatus === "withdrawn" ? now : null,
    createdBy: auth.uid,
  };
  await adminDb.runTransaction(async tx => {
    tx.create(ref, record);
    await writeAuditLog({ actorUserId: auth.uid, action: consentStatus === "granted" ? "GRANT_AI_SUMMARY_CONSENT" : "CHANGE_AI_SUMMARY_CONSENT",
      resourceType: "consent", resourceId: ref.id, beforeSnapshot: null,
      afterSnapshot: { purpose, noticeVersion, consentStatus, capturedAt: now },
      reason: "Pilihan persetujuan dicatat langsung oleh wali", posyanduId: auth.posyanduId }, tx);
  });
  return NextResponse.json({ success: true, consentId: ref.id }, { status: 201 });
}
