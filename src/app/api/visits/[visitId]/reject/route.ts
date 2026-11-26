import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { requireAuth, isAuthError } from "@/lib/auth/server";

// US-T01: rejecting verification requires a reason; the record is never deleted.
export async function POST(req: NextRequest, context: { params: Promise<{ visitId: string }> }) {
  const auth = await requireAuth(req, ["health_worker", "posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  let body: { reason?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5) return NextResponse.json({ error: "Alasan penolakan minimal 5 karakter" }, { status: 400 });
  const { visitId } = await context.params;
  const visitRef = adminDb.collection("visits").doc(visitId);
  const visitSnap = await visitRef.get();
  if (!visitSnap.exists || visitSnap.data()?.posyanduId !== auth.posyanduId) {
    return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
  }
  const visit = visitSnap.data()!;
  if (visit.verificationStatus !== "pending_verification") {
    return NextResponse.json({ error: "Hanya kunjungan menunggu verifikasi yang dapat ditolak" }, { status: 409 });
  }
  const now = new Date().toISOString();
  const version = (visit.version || 1) + 1;
  const measSnap = await adminDb.collection("anthropometry_measurements").where("visitId", "==", visitId).get();
  await adminDb.runTransaction(async tx => {
    tx.update(visitRef, { verificationStatus: "needs_correction", rejectionReason: reason,
      rejectedBy: auth.uid, rejectedAt: now, version, updatedAt: now });
    for (const doc of measSnap.docs) {
      if (!doc.data().supersededAt) tx.update(doc.ref, { verificationStatus: "needs_correction", updatedAt: now });
    }
  });
  await writeAuditLog({ actorUserId: auth.uid, action: "REJECT_VISIT_VERIFICATION", resourceType: "visit",
    resourceId: visitId, beforeSnapshot: { verificationStatus: visit.verificationStatus },
    afterSnapshot: { verificationStatus: "needs_correction", version }, reason, posyanduId: auth.posyanduId });
  return NextResponse.json({ success: true, visitId, status: "needs_correction" });
}
