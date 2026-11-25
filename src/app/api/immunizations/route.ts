import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["parent", "cadre", "health_worker", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId wajib diisi" }, { status: 400 });
  const child = await adminDb.collection("children").doc(childId).get();
  if (!child.exists || child.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  if (auth.role === "parent" && !(child.data()?.guardianUids || []).includes(auth.uid)) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const snap = await adminDb.collection("immunization_events").where("childId", "==", childId).limit(100).get();
  return NextResponse.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "health_worker"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  if (![body.childId, body.vaccineCode, body.administrationDate].every(v => typeof v === "string" && v.trim())) return NextResponse.json({ error: "Data imunisasi belum lengkap" }, { status: 400 });
  const child = await adminDb.collection("children").doc(body.childId).get();
  if (!child.exists || child.data()?.posyanduId !== auth.posyanduId) return NextResponse.json({ error: "Anak tidak ditemukan" }, { status: 404 });
  const ref = adminDb.collection("immunization_events").doc();
  await ref.set({
    posyanduId: auth.posyanduId, childId: body.childId, visitId: body.visitId || null,
    vaccineCode: body.vaccineCode, doseSequence: body.doseSequence || null,
    administrationDate: body.administrationDate, administeredBy: auth.uid,
    facility: body.facility || null, recordSource: "posyandu-entry",
    verificationStatus: "pending_verification", createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ success: true, eventId: ref.id }, { status: 201 });
}
