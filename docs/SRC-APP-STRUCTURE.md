# Struktur `src/app`

Dokumen ini memuat struktur route Next.js App Router yang digunakan pada aplikasi Digital Posyandu saat ini.

```text
src/app/
├── layout.tsx
├── globals.css
│
├── (auth)/
│   └── login/
│       └── page.tsx
│
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── audit-logs/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── users/
│   │       └── page.tsx
│   │
│   ├── cadre/
│   │   ├── page.tsx
│   │   ├── administration/
│   │   │   └── page.tsx
│   │   ├── children/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── [childId]/
│   │   │       ├── services/
│   │   │       │   └── new/
│   │   │       └── visits/
│   │   │           └── new/
│   │   ├── followups/
│   │   │   └── page.tsx
│   │   └── guides/
│   │       └── page.tsx
│   │
│   ├── health-worker/
│   │   ├── page.tsx
│   │   ├── corrections/
│   │   │   └── page.tsx
│   │   └── verifications/
│   │       └── [visitId]/
│   │           ├── page.tsx
│   │           └── correct/
│   │               └── page.tsx
│   │
│   ├── parent/
│   │   ├── page.tsx
│   │   └── children/
│   │       └── [childId]/
│   │           ├── page.tsx
│   │           └── privacy/
│   │               └── page.tsx
│   │
│   └── reviewer/
│       └── page.tsx
│
└── api/
    ├── administration/
    │   └── records/
    │       └── route.ts
    ├── ai/
    │   └── summary/
    │       └── generate/
    │           └── route.ts
    ├── auth/
    │   ├── logout/
    │   │   └── route.ts
    │   └── session/
    │       └── route.ts
    ├── children/
    │   ├── route.ts
    │   └── [childId]/
    │       └── route.ts
    ├── consents/
    │   └── route.ts
    ├── corrections/
    │   ├── request/
    │   │   └── route.ts
    │   └── [requestId]/
    │       └── route.ts
    ├── guardians/
    │   ├── route.ts
    │   └── [guardianId]/
    │       └── route.ts
    ├── health/
    │   └── route.ts
    ├── immunizations/
    │   ├── route.ts
    │   └── [eventId]/
    │       └── review/
    │           └── route.ts
    ├── knowledge/
    │   ├── route.ts
    │   └── [documentId]/
    │       └── approve/
    │           └── route.ts
    ├── memberships/
    │   └── route.ts
    ├── posyandu/
    │   └── route.ts
    ├── reports/
    │   └── export/
    │       └── route.ts
    ├── supplements/
    │   ├── route.ts
    │   └── [eventId]/
    │       └── review/
    │           └── route.ts
    ├── users/
    │   ├── route.ts
    │   └── [uid]/
    │       └── route.ts
    └── visits/
        ├── route.ts
        └── [visitId]/
            ├── correct/
            │   └── route.ts
            ├── reject/
            │   └── route.ts
            └── verify/
                └── route.ts
```

## Struktur `src/components`

```text
src/components/
├── ai/
│   └── VisitSummaryCard.tsx
├── charts/
│   └── GrowthChart.tsx
├── forms/
│   ├── AdministrativeRecordForm.tsx
│   ├── ConsentControl.tsx
│   ├── CorrectionRequestButton.tsx
│   ├── CorrectionRequestModal.tsx
│   ├── CorrectionReviewActions.tsx
│   ├── KnowledgeCreateForm.tsx
│   ├── KnowledgeReviewActions.tsx
│   ├── MeasurementCorrectionForm.tsx
│   ├── PosyanduProfileForm.tsx
│   ├── ServiceEventForm.tsx
│   ├── ServiceEventReviewActions.tsx
│   ├── UserManager.tsx
│   ├── VerifyActions.tsx
│   └── VisitForm.tsx
├── layout/
│   └── DashboardNavigation.tsx
└── ui/
    ├── Badge.tsx
    └── Button.tsx
```
