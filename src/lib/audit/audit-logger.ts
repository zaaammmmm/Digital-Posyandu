import { adminDb } from "../firebase/admin";
import type { Transaction } from "firebase-admin/firestore";
import { sanitizeAuditSnapshot, sanitizeAuditText } from "./sanitize";
export { sanitizeAuditSnapshot } from "./sanitize";

export async function writeAuditLog(params: {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  reason: string;
  posyanduId: string;
}, transaction?: Transaction) {
  const ref = adminDb.collection("audit_logs").doc();
  const entry = {
    actorUserId: params.actorUserId,
    action: params.action.slice(0, 100),
    resourceType: params.resourceType.slice(0, 100),
    resourceId: params.resourceId.slice(0, 200),
    beforeSnapshot: sanitizeAuditSnapshot(params.beforeSnapshot),
    afterSnapshot: sanitizeAuditSnapshot(params.afterSnapshot),
    reason: sanitizeAuditText(params.reason),
    posyanduId: params.posyanduId,
    timestamp: new Date().toISOString(),
  };
  if (transaction) transaction.create(ref, entry);
  else await ref.create(entry);
  return ref.id;
}
