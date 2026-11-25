export type VerificationStatus =
  | "draft"
  | "pending_verification"
  | "verified"
  | "needs_correction"
  | "corrected"
  | "cancelled";

export type Role =
  | "parent"
  | "cadre"
  | "health_worker"
  | "posyandu_admin"
  | "content_reviewer"
  | "system_admin";
