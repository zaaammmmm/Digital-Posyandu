# Conformance Patch — Catatan Perubahan

Patch ini menyelaraskan aplikasi dengan `docs/01–07`. Ia tidak menggantikan validasi lapangan,
persetujuan tenaga kesehatan, atau penilaian privasi.

## Diperbaiki
- `src/lib/ai/summary-provenance.ts` ditambahkan (sebelumnya diimpor tetapi tidak ada, sehingga build gagal).
- `tsconfig.json`: `allowImportingTsExtensions` agar `npm run typecheck` memeriksa file test.
- `requireAuth` menerima cookie sesi (`__session` + `active_posyandu`) selain Bearer token. Penulisan berbasis
  cookie memeriksa `Origin` sama dengan `Host`. Sebelumnya halaman klien memanggil API tanpa token sehingga selalu 401.
- Halaman yang tadinya hardcode kini membaca data tenant dari Firestore dan memakai `requirePageContext`
  (peran dari membership server-side): antrean verifikasi, detail verifikasi, dashboard kader, daftar anak,
  audit log, status reviewer, rekap (pilih periode), detail anak orang tua.
- Klaim yang tidak didukung dihapus: Z-score contoh pada halaman verifikasi, "kemenkes-2024.1 Terverifikasi & Terkunci"
  pada reviewer, dan sumber bawaan "Buku KIA Kemenkes RI 2024" pada kartu ringkasan.
- Registrasi anak memanggil `POST /api/children` (sebelumnya hanya `alert`).
- Orang tua: riwayat kunjungan terverifikasi, imunisasi tercatat, jadwal (hanya dari katalog yang disahkan),
  ringkasan AI, dan status permintaan koreksi.
- Alur koreksi: `PATCH /api/corrections/{id}` + halaman `/health-worker/corrections`.
- Penolakan verifikasi dengan alasan wajib: `POST /api/visits/{id}/reject` (status `needs_correction`).
- Ringkasan AI memuat perbandingan numerik dengan kunjungan terverifikasi sebelumnya.

## Masih terbuka (tidak dikerjakan patch ini)
- Dataset WHO resmi + golden test; katalog imunisasi resmi; antarmuka reviewer untuk mengelolanya (US-T02).
- Pengingat/notifikasi (FR-11); pemantauan tumbuh kembang (API/halaman); ekspor PDF; grafik panjang/tinggi.
- Sinkronisasi draft offline (`draft-storage.ts` belum dipakai); halaman administrasi masih statis.
- Pencarian anak, pengujian Firebase Emulator Rules, backup/restore, uji kegunaan dengan kader.

## Role-access alignment patch

- `system_admin` no longer reads health data (children, guardians, consents, AI summaries, Firestore rules). It still manages accounts, aggregate reports, audit trail and knowledge base.
- Verification, rejection, value correction and correction-request review are limited to `health_worker` (API and pages). `posyandu_admin` keeps members, administration book, reports and audit trail.
- All dashboard pages now have role guards (`/admin`, `/cadre/administration`, `/cadre/guides`, `/cadre/children/new`, `/parent`); the sidebar is filtered by the membership role.
- New: immunization/vitamin form for cadre, head circumference / MUAC / method / equipment fields in the visit form, administration book connected to its API, Posyandu profile editor, reviewer approval of pending knowledge documents.
- Not included: reviewer approval of immunization schedule rules (no API/governance flow yet), development screening, WHO reference dataset.

## Verification, correction screen and reviewer content patch

- Immunization and vitamin records created by cadre now go through `POST /api/immunizations/{id}/review` and `/api/supplements/{id}/review` (health_worker only, reason required for rejection, audited). Guardians only see verified records.
- Bidan correction screen at `/health-worker/verifications/{visitId}/correct`; a correction closes accepted guardian requests for that visit (`status: corrected`).
- Reviewers can submit new knowledge documents (source URL must be http/https); the cadre guide page lists approved documents with search and source/version metadata.

## Cadre follow-up and guardian privacy patch

- Cadre follow-up page (`/cadre/followups`) lists visits returned for correction and rejected immunization/vitamin records with the health worker's reason; the dashboard counter now matches it. Children list has name/registration-number search.
- Guardian privacy page (`/parent/children/{id}/privacy`) records grant/withdraw for the `ai_summary` purpose. Withdrawal stops new AI summaries (verify + generate APIs) and hides existing ones from the guardian. With no record the previous behaviour (summaries allowed) is kept. The notice text/version (`draft-1`) is a placeholder that needs legal review before production.
