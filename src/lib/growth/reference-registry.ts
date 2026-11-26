export type ReferenceApproval = {
  status: "draft" | "approved" | "retired";
  standard: string;
  version: string;
  sourceTitle: string;
  sourceUrl: string;
  effectiveFrom: string;
  approvedBy: string | null;
  approvedAt: string | null;
  datasetSha256: string | null;
  goldenTestSuiteVersion: string | null;
};

export type ReferenceReadiness = {
  ready: boolean;
  reason: string;
  standard: string;
  version: string;
};

/**
 * Validates provenance metadata only. This function deliberately does not
 * claim that a reference dataset is clinically correct; that requires review
 * and golden tests by an authorized health professional.
 */
export function assessReferenceReadiness(
  manifest: ReferenceApproval | null | undefined,
): ReferenceReadiness {
  const fallback = { standard: "WHO_CHILD_GROWTH_STANDARDS", version: "not-installed" };
  if (!manifest) return { ready: false, reason: "REFERENCE_MANIFEST_MISSING", ...fallback };
  if (manifest.status !== "approved") return {
    ready: false, reason: "REFERENCE_NOT_APPROVED",
    standard: manifest.standard, version: manifest.version,
  };
  const required = [
    manifest.standard, manifest.version, manifest.sourceTitle, manifest.sourceUrl,
    manifest.effectiveFrom, manifest.approvedBy, manifest.approvedAt,
    manifest.datasetSha256, manifest.goldenTestSuiteVersion,
  ];
  if (required.some(value => typeof value !== "string" || !value.trim())) return {
    ready: false, reason: "REFERENCE_PROVENANCE_INCOMPLETE",
    standard: manifest.standard, version: manifest.version,
  };
  if (!/^[a-f0-9]{64}$/i.test(manifest.datasetSha256!)) return {
    ready: false, reason: "REFERENCE_CHECKSUM_INVALID",
    standard: manifest.standard, version: manifest.version,
  };
  return { ready: true, reason: "METADATA_COMPLETE_REQUIRES_RUNTIME_DATASET_VALIDATION",
    standard: manifest.standard, version: manifest.version };
}
