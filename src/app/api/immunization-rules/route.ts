import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/audit/audit-logger";
import { validateImmunizationRuleDraft } from "@/lib/schedule/immunization-rule-validation";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["content_reviewer"]);
  if (isAuthError(auth)) return auth;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 }); }
  const validation = validateImmunizationRuleDraft(body);
  if (!validation.valid || !validation.data) {
    return NextResponse.json({ error: "Data aturan imunisasi tidak valid", details: validation.errors }, { status: 400 });
  }
  const ref = adminDb.collection("immunization_schedule_rules").doc();
  const now = new Date().toISOString();
  const draft = { ...validation.data, status: "draft", approvedBy: null, approvedAt: null, createdBy: auth.uid, createdAt: now, updatedAt: now };
  await adminDb.runTransaction(async transaction => {
    transaction.create(ref, draft);
    await writeAuditLog({ actorUserId: auth.uid, action: "IMMUNIZATION_RULE_CREATED", resourceType: "immunization_schedule_rule", resourceId: ref.id, beforeSnapshot: null, afterSnapshot: draft, reason: "Membuat draft aturan imunisasi", posyanduId: auth.posyanduId }, transaction);
  });
  return NextResponse.json({ success: true, ruleId: ref.id, status: "draft" }, { status: 201 });
}
