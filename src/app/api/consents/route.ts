import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["parent", "cadre", "posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId wajib diisi" }, { status: 400 });
  const child = await adminDb.collection("children").doc(childId).get();
  if (!child.exists || child.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  if (auth.role === "parent" && !(child.data()?.guardianUids || []).includes(auth.uid)) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const snap = await adminDb.collection("consent_records").where("childId", "==", childId).limit(100).get();
  return NextResponse.json({ items: snap.docs.map(d => {
    const v = d.data(); return { id: d.id, purpose: v.purpose, noticeVersion: v.noticeVersion,
      consentStatus: v.consentStatus, capturedAt: v.capturedAt, withdrawnAt: v.withdrawnAt };
  }) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["parent", "cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  const { childId, purpose, noticeVersion, consentStatus } = body;
  if (![childId, purpose, noticeVersion].every(v => typeof v === "string" && v.trim()) ||
      !["granted", "withdrawn", "declined"].includes(consentStatus)) {
    return NextResponse.json({ error: "Data persetujuan tidak valid" }, { status: 400 });
  }
  const childRef = adminDb.collection("children").doc(childId);
  const child = await childRef.get();
  if (!child.exists || child.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  if (auth.role === "parent" && !(child.data()?.guardianUids || []).includes(auth.uid)) return NextResponse.json({ error: "Wali tidak berwenang" }, { status: 403 });
  const now = new Date().toISOString();
  const ref = adminDb.collection("consent_records").doc();
  await ref.set({
    posyanduId: auth.posyanduId, childId, guardianUid: auth.uid,
    purpose, noticeVersion, consentStatus, capturedAt: now,
    withdrawnAt: consentStatus === "withdrawn" ? now : null,
    createdBy: auth.uid,
  });
  return NextResponse.json({ success: true, consentId: ref.id }, { status: 201 });
}
