import { adminDb } from "@/lib/firebase/admin";

/** Consent purpose for automatic AI summaries. Notice text/version still needs legal review. */
export const AI_SUMMARY_PURPOSE = "ai_summary";
export const AI_SUMMARY_NOTICE_VERSION = "draft-1";

/**
 * Latest decision wins. With no record the existing behaviour is kept (summaries allowed);
 * a guardian can withdraw or decline, which stops new summaries and hides existing ones.
 */
export async function isAiSummaryAllowed(posyanduId: string, childId: string): Promise<boolean> {
  const snap = await adminDb.collection("consent_records")
    .where("childId", "==", childId).where("purpose", "==", AI_SUMMARY_PURPOSE).limit(100).get();
  const latest = snap.docs
    .map(d => d.data())
    .filter(d => d.posyanduId === posyanduId)
    .sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)))[0];
  return !latest || latest.consentStatus === "granted";
}
