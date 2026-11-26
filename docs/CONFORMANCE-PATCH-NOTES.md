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
