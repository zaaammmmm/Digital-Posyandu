# Firestore Collection Catalog — Digital Posyandu

Dokumen ini memetakan Data Dictionary PRD (nama entitas tunggal/logis) ke nama collection Firestore yang dipakai repository. Ini adalah kontrak implementasi awal, bukan pengganti validasi lapangan, kebijakan retensi, atau review tenaga kesehatan.

## Mapping PRD → Firestore

| Entitas PRD | Collection / sumber identitas | Field minimum yang tampak pada implementasi | Seed awal |
|---|---|---|---|
| `posyandu` | `posyandu/{posyanduId}` | `name`, `addressArea`, `village`, `district`, `regency`, `province`, `serviceSchedule`, `status`, timestamps | Ya, dari environment |
| `user` | Firebase Auth + `users/{uid}` | `uid`, `email`, `displayName`, `accountStatus`, timestamps | Opsional, akun bootstrap |
| `membership` | `memberships/{uid}_{posyanduId}` | `userId`, `posyanduId`, `role`, `scope`, `status`, `createdBy`, timestamps | Opsional, admin/reviewer |
| `child` | `children/{childId}` | `posyanduId`, `registrationNumber`, `fullName`, `dateOfBirth`, `sex`, `guardianUids`, `recordStatus`, timestamps | Tidak |
| `guardian` | `guardians/{guardianId}` | `posyanduId`, `userId`, `fullName`, `relationship`, `contactEncrypted`, timestamps | Tidak |
| `child_guardian` | `child_guardians/{linkId}` (relasi target PRD) | `posyanduId`, `childId`, `guardianId`, `guardianUid`, `relationship`, `isPrimary`, `authorizationStatus`, `consentRecordId` | Tidak; saat ini API utama masih menggunakan `guardianUids` pada child |
| `consent_record` | `consent_records/{consentId}` | `posyanduId`, `childId`, `guardianUid`, `purpose`, `noticeVersion`, `consentStatus`, `capturedAt`, `withdrawnAt`, `createdBy` | Tidak |
| `visit` | `visits/{visitId}` | `childId`, `posyanduId`, `guardianUid`, `visitDate`, `recordedBy`, `verificationStatus`, `verifiedBy`, `verifiedAt`, `notes`, `version`, timestamps | Tidak |
| `anthropometry_measurement` | `anthropometry_measurements/{measurementId}` | `visitId`, `childId`, `posyanduId`, `ageMonths`, `sex`, `weightKg`, `lengthHeightCm`, `measurementType`, `qualityFlags`, `verificationStatus`, `measuredAt`, `recordedBy` | Tidak |
| `growth_assessment` | `growth_assessments/{assessmentId}` | `measurementId`, `childId`, `posyanduId`, `guardianUid`, `indicator`, `zScore`, `classificationCode`, `referenceStandard`, `referenceVersion`, `calculationEngineVersion`, `reviewStatus`, `calculatedAt` | Tidak |
| `immunization_event` | `immunization_events/{eventId}` | `posyanduId`, `childId`, `visitId`, `vaccineCode`, `doseSequence`, `administrationDate`, `administeredBy`, `facility`, `recordSource`, `verificationStatus`, `notes` | Tidak |
| `immunization_schedule_rule` | `immunization_schedule_rules/{ruleId}` | `vaccineCode`, `targetAgeOrCondition`, `ruleDescription`, `effectiveFrom`, `effectiveUntil`, `officialSource`, `sourceDocumentVersion`, `reviewedBy`, `approvedAt`, `status` | Opsional; hanya `draft` |
| `supplement_event` | `supplement_events/{eventId}` | `posyanduId`, `childId`, `visitId`, `supplementType`, `administrationDate`, `recordedBy`, `verificationStatus`, `notes` | Tidak |
| `development_screening` | `development_screenings/{screeningId}` | `posyanduId`, `childId`, `visitId`, `instrumentName`, `instrumentVersion`, `screeningDate`, `result`, `followUpAction`, `performedBy`, `verificationStatus` | Tidak |
| `ai_summary` | `ai_summaries/{summaryId}` | `posyanduId`, `childId`, `visitId`, `inputRecordVersion`, `modelProvider`, `modelVersion`, `promptVersion`, `knowledgeSourceIds`, `generatedText`, `safetyStatus`, `reviewStatus`, `generatedAt` | Tidak |
| `education_content` | `education_content/{contentId}` | `title`, `topic`, `body`, `sourceTitle`, `sourceUrl`, `publisher`, `version`, `status` | Tidak |
| `administrative_record` | `administrative_records/{recordId}` | `posyanduId`, `recordType`, `recordDate`, `title`, `structuredPayload`, `attachmentRefs`, `createdBy`, `updatedBy`, timestamps | Tidak |
| `audit_log` | `audit_logs/{logId}` | `posyanduId`, `actorUserId`, `action`, `resourceType`, `resourceId`, `beforeSnapshot`, `afterSnapshot`, `reason`, `timestamp` | Tidak |
| PRD AI/RAG extension | `knowledge_documents/{documentId}` | `title`, `text`, `sourceTitle`, `sourceUrl`, `version`, `keywords`, `status`, `createdBy`, `reviewedBy`, `reviewedAt` | Opsional; hanya `pending_review` |
| Workflow extension | `correction_requests/{requestId}` | `posyanduId`, `visitId`, `requestedBy`, `reason`, `status`, `createdAt` | Tidak |

## Catatan kesesuaian dan batasan

1. Firestore tidak memerlukan deklarasi atau pembuatan collection kosong. Collection klinis akan muncul saat dokumen valid pertama ditulis melalui workflow aplikasi. Seeder sengaja tidak membuat dokumen placeholder pada collection klinis karena dokumen tersebut dapat mengotori query dan statistik.
2. PRD menggambarkan relasi `child_guardian` sebagai entitas tersendiri. Implementasi saat ini menggunakan `guardianUids` pada `children` dan `guardianUid` pada `visits`; migrasi ke relasi many-to-many harus dilakukan terpisah dengan rencana backfill dan pengujian akses.
3. `immunization_schedule_rules` dan `development_screenings` sudah dipetakan sebagai collection target, tetapi alur API lengkapnya belum tersedia. Jangan menganggap fitur tersebut aktif hanya karena rules dan collection catalog telah disiapkan.
4. `knowledge_documents` merupakan extension untuk RAG; ia bukan pengganti `education_content`. Dokumen hanya dapat dibaca dari client ketika `status == approved`; seeder memaksa status `pending_review`.
5. Jadwal imunisasi yang diimpor seeder selalu `draft`. PRD mensyaratkan sumber resmi, versi dokumen, masa berlaku, reviewer, dan persetujuan. Jangan mengaktifkan jadwal produksi tanpa verifikasi petugas berwenang.
6. Pertumbuhan: jangan seed Z-score, klasifikasi, atau referensi WHO rekaan. Aktifkan penilaian hanya setelah referensi resmi berversi dan golden tests disetujui.
7. Data pengguna dan anak harus diminimalkan. Jangan memakai NIK sebagai document ID/primary key; jangan seed nomor telepon, alamat rinci, atau data kesehatan personal.
8. `npm run seed:demo` adalah seeder data sintetis **terpisah** untuk uji tampilan per peran (dev/staging). Ia tidak mengubah kontrak di atas: seluruh dokumen berid `demo-*` dengan `seededBy` penanda, tidak memuat Z-score, dan tidak boleh dijalankan pada tenant berisi data nyata. Lihat README bagian "Data demo".

## Collection yang dibuat oleh workflow, bukan seeder

`children`, `guardians`, `child_guardians`, `consent_records`, `visits`, `anthropometry_measurements`, `growth_assessments`, `immunization_events`, `supplement_events`, `development_screenings`, `ai_summaries`, `education_content`, `administrative_records`, `audit_logs`, dan `correction_requests` harus diisi oleh proses aplikasi yang tervalidasi. Seeder bootstrap tidak mengisi data pasien.
