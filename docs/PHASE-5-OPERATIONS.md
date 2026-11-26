# Phase 5 — Operational Management & Reporting

## API administrasi dasar

Endpoint `GET/POST /api/administration/records` mendukung jenis:
- `activity` — buku kegiatan/jadwal
- `attendance` — daftar hadir
- `minutes` — notulen
- `home_visit` — kunjungan rumah
- `inventory` — inventaris

Semua query dibatasi ke `posyanduId` dari membership server-side. Klien tidak dapat menentukan tenant, pembuat, atau status record. Pembuatan record dicatat ke audit log.

## Batas implementasi

Endpoint ini menyediakan fondasi CRUD-create/read. Update, penghapusan, lampiran, buku kas, daftar bantuan, dan ekspor detail tidak diaktifkan otomatis; masing-masing memerlukan skema, validasi, dan izin tambahan. Ekspor agregat tetap menggunakan endpoint laporan yang sudah ada.
