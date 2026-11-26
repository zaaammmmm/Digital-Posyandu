import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { requireAuth, isAuthError } from "@/lib/auth/server";

// Reviewing a request only records the decision. Changing measurement values still
// goes through POST /api/visits/{id}/correct, which versions the record and audits it.
export async function PATCH(req: NextRequest, context: { params: Promise<{ requestId: string }> }) {
  const auth = await requireAuth(req, ["health_worker", "posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  let body: { decision?: unknown; note?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!["accepted", "rejected"].includes(String(body.decision)) || note.length < 5) {
    return NextResponse.json({ error: "Keputusan (accepted/rejected) dan catatan minimal 5 karakter wajib diisi" }, { status: 400 });
  }
  const { requestId } = await context.params;
  const ref = adminDb.collection("correction_requests").doc(requestId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.posyanduId !== auth.posyanduId) {
    return NextResponse.json({ error: "Permintaan koreksi tidak ditemukan" }, { status: 404 });
  }
  const before = snap.data()!;
  if (before.status !== "pending_review") {
    return NextResponse.json({ error: "Permintaan ini sudah ditinjau" }, { status: 409 });
  }
  const now = new Date().toISOString();
  const status = body.decision === "accepted" ? "accepted_pending_correction" : "rejected";
  await ref.update({ status, reviewedBy: auth.uid, reviewedAt: now, reviewNote: note.slice(0, 2000) });
  await writeAuditLog({ actorUserId: auth.uid, action: "REVIEW_CORRECTION_REQUEST", resourceType: "correction_request",
    resourceId: requestId, beforeSnapshot: { status: before.status }, afterSnapshot: { status }, reason: note.slice(0, 2000),
    posyanduId: auth.posyanduId });
  return NextResponse.json({ success: true, requestId, status });
}
