import { adminDb } from "../firebase/admin";

export async function writeAuditLog(params: {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  reason: string;
}) {
  const now = new Date().toISOString();
  await adminDb.collection("audit_logs").add({
    ...params,
    timestamp: now,
  });
}
