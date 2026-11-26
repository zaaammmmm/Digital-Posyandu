import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { requireAuth, isAuthError } from "@/lib/auth/server";

// US-T01: rejecting verification requires a reason; the record is never deleted.
export async function POST(req: NextRequest, context: { params: Promise<{ visitId: string }> }) {
  const auth = await requireAuth(req, ["health_worker"]);
  if (isAuthError(auth)) return auth;
  let body: { reason?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5) return NextResponse.json({ error: "Alasan penolakan minimal 5 karakter" }, { status: 400 });
  const { visitId } = await context.params;
  const visitRef = adminDb.collection("visits").doc(visitId);
  const now = new Date().toISOString();
  let version = 1;
  try {
    await adminDb.runTransaction(async tx => {
      const visitSnap = await tx.get(visitRef);
      if (!visitSnap.exists || visitSnap.data()?.posyanduId !== auth.posyanduId) throw new Error("NOT_FOUND");
      const visit = visitSnap.data()!;
      if (visit.verificationStatus !== "pending_verification") throw new Error("NOT_PENDING");
      const measurementQuery = adminDb.collection("anthropometry_measurements").where("visitId", "==", visitId);
      const measurements = await tx.get(measurementQuery);
      version = (Number(visit.version) || 1) + 1;
      tx.update(visitRef, { verificationStatus: "needs_correction", rejectionReason: reason,
        rejectedBy: auth.uid, rejectedAt: now, version, updatedAt: now });
      for (const doc of measurements.docs) {
        if (!doc.data().supersededAt) tx.update(doc.ref, { verificationStatus: "needs_correction", updatedAt: now });
      }
      await writeAuditLog({ actorUserId: auth.uid, action: "REJECT_VISIT_VERIFICATION", resourceType: "visit",
        resourceId: visitId, beforeSnapshot: { verificationStatus: visit.verificationStatus },
        afterSnapshot: { verificationStatus: "needs_correction", version }, reason,
        posyanduId: auth.posyanduId }, tx);
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });
    if (code === "NOT_PENDING") return NextResponse.json({ error: "Hanya kunjungan menunggu verifikasi yang dapat ditolak" }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ success: true, visitId, status: "needs_correction" });
}
