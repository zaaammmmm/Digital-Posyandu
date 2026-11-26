import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { canApproveImmunizationRule } from "@/lib/schedule/immunization-rule-validation";

export async function POST(req: NextRequest, context: { params: Promise<{ ruleId: string }> }) {
  const auth = await requireAuth(req, ["content_reviewer"]);
  if (isAuthError(auth)) return auth;
  const { ruleId } = await context.params;
  const ref = adminDb.collection("immunization_schedule_rules").doc(ruleId);
  const now = new Date().toISOString();
  const outcome = await adminDb.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return "NOT_FOUND";
    const before = snap.data()!;
    if (!canApproveImmunizationRule(before)) return before.status === "draft" ? "INCOMPLETE" : "NOT_DRAFT";
    const after = { ...before, status: "approved", approvedBy: auth.uid, approvedAt: now, updatedAt: now };
    transaction.update(ref, { status: "approved", approvedBy: auth.uid, approvedAt: now, updatedAt: now });
    await writeAuditLog({ actorUserId: auth.uid, action: "IMMUNIZATION_RULE_APPROVED", resourceType: "immunization_schedule_rule", resourceId: ruleId, beforeSnapshot: before, afterSnapshot: after, reason: "Mengesahkan aturan imunisasi dengan metadata sumber dan versi", posyanduId: auth.posyanduId }, transaction);
    return "OK";
  });
  if (outcome === "NOT_FOUND") return NextResponse.json({ error: "Aturan tidak ditemukan" }, { status: 404 });
  if (outcome === "NOT_DRAFT") return NextResponse.json({ error: "Hanya draft yang dapat disahkan" }, { status: 409 });
  if (outcome === "INCOMPLETE") return NextResponse.json({ error: "Metadata aturan belum lengkap atau sumber bukan HTTPS" }, { status: 422 });
  return NextResponse.json({ success: true, status: "approved" });
}
