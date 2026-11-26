import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";

/** Fixed-window, per-user server-side limiter. One document is retained per actor/action. */
export async function consumeRateLimit(input: {
  actorId: string;
  action: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  const id = crypto.createHash("sha256").update(`${input.action}:${input.actorId}`).digest("hex");
  const ref = adminDb.collection("_rate_limits").doc(id);
  return adminDb.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const startedAt = Number(data?.windowStartedAt || 0);
    const active = startedAt > 0 && now - startedAt < input.windowMs;
    const count = active ? Number(data?.count || 0) : 0;
    if (count >= input.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((input.windowMs - (now - startedAt)) / 1000)) };
    }
    tx.set(ref, { action: input.action, actorHash: id, windowStartedAt: active ? startedAt : now,
      count: count + 1, updatedAt: new Date(now).toISOString() });
    return { allowed: true, retryAfterSeconds: 0 };
  });
}
