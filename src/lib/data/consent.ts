import { adminDb } from "@/lib/firebase/admin";

/** Configure only after the consent notice has been reviewed and approved. */
export const AI_SUMMARY_PURPOSE = "ai_summary";
export const AI_SUMMARY_NOTICE_VERSION = process.env.AI_SUMMARY_NOTICE_VERSION?.trim() || "";

/**
 * AI processing is deny-by-default. A current, explicit grant from a currently
 * linked guardian and the currently configured notice version is required.
 */
export async function isAiSummaryAllowed(posyanduId: string, childId: string): Promise<boolean> {
  if (!AI_SUMMARY_NOTICE_VERSION) return false;

  const childSnap = await adminDb.collection("children").doc(childId).get();
  const child = childSnap.data();
  if (!childSnap.exists || !child || child.posyanduId !== posyanduId || !Array.isArray(child.guardianUids)) return false;
  const guardianUids = new Set(child.guardianUids.filter((value: unknown): value is string => typeof value === "string"));
  if (guardianUids.size === 0) return false;

  const snap = await adminDb.collection("consent_records")
    .where("childId", "==", childId).where("purpose", "==", AI_SUMMARY_PURPOSE).get();
  const latest = snap.docs
    .map(d => d.data())
    .filter(d => d.posyanduId === posyanduId
      && typeof d.guardianUid === "string" && guardianUids.has(d.guardianUid)
      && d.noticeVersion === AI_SUMMARY_NOTICE_VERSION)
    .sort((a, b) => String(b.capturedAt || "").localeCompare(String(a.capturedAt || "")))[0];
  return latest?.consentStatus === "granted";
}
