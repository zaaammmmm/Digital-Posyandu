import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export type ServiceEventCollection = "immunization_events" | "supplement_events";

/**
 * Shared verify/reject handler for immunization and supplement events.
 * Only health_worker may decide; the record is never deleted and every decision is audited.
 */
export async function reviewServiceEvent(
  req: NextRequest,
  eventId: string,
  collection: ServiceEventCollection,
): Promise<NextResponse> {
  const auth = await requireAuth(req, ["health_worker"]);
  if (isAuthError(auth)) return auth;
  let body: { decision?: unknown; reason?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }
  const decision = String(body.decision);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!["verified", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Keputusan harus verified atau rejected" }, { status: 400 });
  }
  if (decision === "rejected" && reason.length < 5) {
    return NextResponse.json({ error: "Alasan penolakan minimal 5 karakter" }, { status: 400 });
  }
  const ref = adminDb.collection(collection).doc(eventId);
  const now = new Date().toISOString();
  let before: Record<string, unknown> = {};
  try {
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (!snap.exists || !data || data.posyanduId !== auth.posyanduId) throw new Error("NOT_FOUND");
      if (data.verificationStatus !== "pending_verification") throw new Error("NOT_PENDING");
      before = { verificationStatus: data.verificationStatus };
      tx.update(ref, decision === "verified"
        ? { verificationStatus: "verified", verifiedBy: auth.uid, verifiedAt: now, updatedAt: now }
        : { verificationStatus: "rejected", rejectionReason: reason.slice(0, 2000),
            rejectedBy: auth.uid, rejectedAt: now, updatedAt: now });
      await writeAuditLog({
        actorUserId: auth.uid,
        action: decision === "verified" ? "VERIFY_SERVICE_EVENT" : "REJECT_SERVICE_EVENT",
        resourceType: collection === "immunization_events" ? "immunization_event" : "supplement_event",
        resourceId: eventId, beforeSnapshot: before, afterSnapshot: { verificationStatus: decision },
        reason: decision === "verified" ? "Verifikasi oleh petugas berwenang" : reason.slice(0, 2000),
        posyanduId: auth.posyanduId,
      }, tx);
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "NOT_FOUND") return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    if (code === "NOT_PENDING") return NextResponse.json({ error: "Hanya catatan menunggu verifikasi yang dapat diproses" }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ success: true, eventId, status: decision });
}
