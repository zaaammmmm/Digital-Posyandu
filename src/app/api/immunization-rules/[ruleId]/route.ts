import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { validateImmunizationRuleDraft } from "@/lib/schedule/immunization-rule-validation";

export async function PATCH(req: NextRequest, context: { params: Promise<{ ruleId: string }> }) {
  const auth = await requireAuth(req, ["content_reviewer"]);
  if (isAuthError(auth)) return auth;
  const { ruleId } = await context.params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 }); }
  const validation = validateImmunizationRuleDraft(body);
  if (!validation.valid || !validation.data) return NextResponse.json({ error: "Data aturan imunisasi tidak valid", details: validation.errors }, { status: 400 });
  const ref = adminDb.collection("immunization_schedule_rules").doc(ruleId);
  const now = new Date().toISOString();
  const outcome = await adminDb.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return "NOT_FOUND";
    const before = snap.data()!;
    if (before.status !== "draft") return "NOT_DRAFT";
    const after = { ...validation.data, status: "draft", approvedBy: null, approvedAt: null, updatedBy: auth.uid, updatedAt: now };
    transaction.update(ref, after);
    await writeAuditLog({ actorUserId: auth.uid, action: "IMMUNIZATION_RULE_DRAFT_UPDATED", resourceType: "immunization_schedule_rule", resourceId: ruleId, beforeSnapshot: before, afterSnapshot: after, reason: "Memperbarui draft aturan imunisasi", posyanduId: auth.posyanduId }, transaction);
    return "OK";
  });
  if (outcome === "NOT_FOUND") return NextResponse.json({ error: "Aturan tidak ditemukan" }, { status: 404 });
  if (outcome === "NOT_DRAFT") return NextResponse.json({ error: "Aturan yang sudah diproses tidak dapat diubah; buat versi baru" }, { status: 409 });
  return NextResponse.json({ success: true, status: "draft" });
}
