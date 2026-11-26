# PRD Conformance Patch — Digital Posyandu

## Scope

Patch ini memperbaiki risiko yang dapat ditangani secara aman dari source code saat ini. Patch tidak mengklaim aplikasi sudah sepenuhnya memenuhi PRD atau siap memproses data kesehatan nyata.

## Perubahan yang diterapkan

1. **Consent AI deny-by-default**
   - Tidak ada consent record berarti AI summary tidak boleh dibuat.
   - Consent hanya berlaku untuk tujuan `ai_summary`, wali yang masih terhubung dengan anak, tenant yang sama, dan versi pemberitahuan yang sedang dikonfigurasi.
   - `AI_SUMMARY_NOTICE_VERSION` harus diisi setelah pemberitahuan privasi disetujui. Nilai kosong membuat persetujuan dan pembuatan ringkasan tetap nonaktif.
   - Riwayat consent yang dibaca orang tua dibatasi pada keputusan milik wali yang sedang login.
2. **Payload AI konsisten**
   - Ringkasan otomatis dan manual memakai builder yang sama.
   - Payload mengambil pengukuran terverifikasi sebelumnya, penilaian yang tersimpan, layanan imunisasi/vitamin terverifikasi, pengingat dari katalog imunisasi approved, dan cuplikan edukasi approved.
   - Payload memakai allow-list, validasi rentang numerik, batas jumlah item, serta redaksi email/telepon/nomor identitas pada teks sumber.
3. **AI safety**
   - Memperketat pemeriksaan konten klinis, instruksi obat, klaim tanpa sumber, dan identifier langsung.
   - Output yang gagal pemeriksaan menggunakan fallback deterministik.
   - Pemeriksaan pola bukan jaminan keselamatan klinis; review manusia dan evaluasi adversarial tetap wajib.
4. **Audit trail**
   - Audit untuk verifikasi kunjungan, koreksi pengukuran, review imunisasi/vitamin, dan perubahan consent ditulis dalam transaksi Firestore yang sama dengan perubahan utama.
   - Snapshot audit membatasi kedalaman/jumlah field dan meredaksi key sensitif serta identifier umum.
   - Audit log tetap bukan immutable terhadap Admin SDK; pembatasan IAM, Cloud Audit Logs, backup, dan kontrol akses proyek Firebase masih diperlukan.
5. **Rate limiting**
   - Penulisan consent dibatasi 20 permintaan/10 menit per pengguna.
   - Pembuatan ringkasan manual dibatasi 5 permintaan/10 menit per pengguna.
   - Koleksi `_rate_limits` hanya boleh diakses server/Admin SDK. Firestore Rules default-deny harus dipertahankan.
6. **Pemberitahuan privasi**
   - Halaman privasi menjelaskan kategori data yang digunakan, larangan pengiriman identifier langsung, dan kemungkinan pemrosesan Gemini.
   - Teks ini tetap harus ditinjau bagian hukum/pengelola data dan disesuaikan dengan penyedia, retensi, dasar pemrosesan, serta kebijakan institusi sebelum versi consent diaktifkan.

## Belum dapat diselesaikan hanya dari source ZIP

| Persyaratan | Mengapa tidak diisi otomatis | Syarat untuk menutup |
|---|---|---|
| WAZ, LAZ/HAZ, WLZ/WHZ WHO | Tidak boleh membuat atau menebak tabel/LMS klinis | Dataset resmi sesuai kelompok umur/indikator, lisensi/sumber, checksum, golden test, review tenaga kesehatan, dan validasi runtime |
| Jadwal imunisasi resmi | Katalog kosong sengaja fail-closed | Katalog nasional/daerah yang berlaku, sumber resmi, versi, tanggal efektif, persetujuan dan workflow revisi |
| Skrining tumbuh kembang | Instrumen dan aturan interpretasi tidak disediakan | Instrumen resmi yang dipilih institusi, versi, petugas berwenang, hasil dan tindak lanjut yang disetujui |
| Notifikasi wali | Kanal, kredensial, template, dan persetujuan kanal tidak tersedia | Provider/kanal, consent komunikasi, template, retry, delivery log, dan mekanisme opt-out |
| Backup/restore dan immutable audit | Memerlukan konfigurasi proyek/infrastruktur | Jadwal backup, enkripsi, retensi, uji restore, IAM least privilege, Cloud Audit Logs dan prosedur incident response |
| Firebase Emulator security tests | Memerlukan emulator dan konfigurasi lingkungan uji | Test matrix seluruh role, tenant, guardian ownership, rules, API, dan regression CI |
| Offline-first penuh | Perlu keputusan konflik dan kebijakan penyimpanan perangkat | Integrasi draft ke formulir, enkripsi lokal, expiry, sync queue, conflict resolution, dan uji multi-device |
| PDF dan seluruh buku administrasi | Format resmi lokal dan kebutuhan operasional belum tersedia | Template disahkan, validasi pemilik proses, ekspor berizin, audit dan pengujian |
| Chatbot RAG | PRD menyebutnya fitur opsional; belum ada UX/API percakapan lengkap | Retrieval terukur, sitasi sumber, safety policy, refusal, evaluasi, dan review konten |

## Konfigurasi

Tambahkan ke environment server setelah pemberitahuan persetujuan disetujui:

```env
AI_SUMMARY_NOTICE_VERSION=versi-pemberitahuan-yang-disahkan
```

Jangan mengisi nilai contoh tersebut sebagai persetujuan hukum. Jika belum disahkan, biarkan kosong agar AI summary tetap nonaktif.

Pastikan `FIELD_ENCRYPTION_KEY` tersedia dan disimpan di secret manager. Jangan mengganti key tanpa rencana migrasi ciphertext dan prosedur pemulihan.

## Verifikasi lokal

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Lanjutkan dengan Firebase Emulator dan uji manual:

- Tanpa consent: ringkasan otomatis dan manual ditolak/tidak dibuat.
- Consent dari wali aktif dengan versi aktif: boleh diproses.
- Consent versi lama, guardian yang sudah tidak terhubung, atau tenant berbeda: ditolak.
- Cabut consent: ringkasan baru tidak dibuat dan ringkasan lama tidak ditampilkan melalui portal wali.
- `system_admin`: tidak dapat membaca catatan kesehatan.
- Parent A tidak dapat membaca anak milik Parent B.
- Kader Posyandu A tidak dapat membaca atau mengubah data Posyandu B.
- Kegagalan penulisan audit membatalkan perubahan yang harus diaudit.
- Rate limit menghasilkan HTTP 429 dan header `Retry-After`.
- Uji payload AI dengan email, nomor telepon, NIK, teks prompt injection, dan output berisi instruksi klinis.

**Jangan deploy ke produksi hanya karena typecheck/build lulus.** Seluruh syarat klinis, legal, keamanan, backup/restore, dan pilot lapangan tetap menjadi release gate.
