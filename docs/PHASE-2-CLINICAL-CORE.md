# Phase 2 — Clinical Core Governance

## Implemented in this patch

- Generic LMS Z-score mathematical primitive with finite/positive input guards.
- Structural LMS row validation for indicator, sex, coordinate, L/M/S values, and duplicate coordinates.
- Reviewer-only API to create and update immunization rule drafts and approve complete drafts.
- Approved immunization rules are not editable through the draft endpoint; create a new version instead.
- Rule create/update/approval and audit entries are committed in the same Firestore transaction.
- Reviewer page can create drafts and approve them after checking the cited source document.

## Clinical safety boundary

This patch does **not** include WHO reference LMS tables, clinical cut-offs, or a national immunization schedule. The LMS helper is mathematical infrastructure only. It is not wired into the growth assessment workflow and must not be used to generate a child's clinical result until all of the following are completed:

1. Obtain the exact official reference dataset and applicable technical documentation from an authoritative source.
2. Verify licensing/terms, source version, checksum, sex/indicator coverage, measurement dimensions, and effective dates.
3. Have an authorized clinician review the dataset and independently approved golden test cases.
4. Add interpolation/edge handling rules required by that exact dataset and compare results against independently calculated references.
5. Connect the approved dataset to the growth engine while preserving `null`/fail-closed behavior if any check fails.

Immunization rules are entered from the official source by a content reviewer. Approval records reviewer identity and timestamp. This workflow does not independently establish that the source is clinically authoritative; that remains a governance responsibility.

## Not included yet

- No WHO dataset is bundled or activated.
- No invented immunization schedule or dose sequence is included.
- No developmental screening questions, scoring thresholds, or instruments are invented. Select and approve the exact official instrument and its permitted use before implementing its operational form.
- No clinical classifications are inferred from the generic LMS formula.
