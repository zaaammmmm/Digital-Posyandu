# Phase 1 — Security & Privacy Hardening

Patch ini memperkuat beberapa kontrol aplikasi yang dapat ditegakkan langsung dari repository. Patch ini **bukan** bukti bahwa seluruh kontrol keamanan operasional telah selesai.

## Perubahan kode

1. `requireAuth()` menerapkan baseline rate limit untuk semua request API terautentikasi selain GET/HEAD/OPTIONS: 120 write per pengguna per 60 detik. Batas khusus pada endpoint AI dan consent tetap berlaku sebagai lapisan tambahan.
2. Review permintaan koreksi menjalankan pembacaan status, perubahan keputusan, dan pencatatan audit dalam satu transaksi Firestore.
3. Penolakan verifikasi kunjungan menjalankan pembacaan kunjungan/pengukuran, perubahan status kunjungan/pengukuran, dan pencatatan audit dalam satu transaksi Firestore.
4. Production preflight memvalidasi `FIELD_ENCRYPTION_KEY` dengan format yang benar-benar diterima implementasi AES-256-GCM: tepat 64 karakter hex.
5. Test statis menjaga agar kontrol di atas tidak terhapus tanpa disadari.

## Batasan yang tetap harus diselesaikan sebelum produksi

### Firebase Emulator Rules tests

`tests/security-hardening.test.ts` dan `tests/role-access.test.ts` adalah test statis kode, **bukan** Firebase Rules Unit Testing. Sebelum produksi, tambahkan test emulator memakai `@firebase/rules-unit-testing` dan jalankan terhadap `firestore.rules` untuk:

- enam role: parent, cadre, health_worker, posyandu_admin, content_reviewer, system_admin;
- akses tenant sendiri dan tenant lain;
- kepemilikan anak oleh guardian;
- akses reviewer ke knowledge dan aturan approved;
- penolakan seluruh direct client writes ke data klinis, consent, membership, dan audit.

Jalankan emulator dengan `npm run emulators` dan jalankan suite Rules khusus pada CI. Jangan menandai gate ini lulus hanya dari test statis.

### Audit log append-only

Firestore Security Rules menolak client writes, tetapi Admin SDK tetap dapat mengubah dokumen. Terapkan IAM least-privilege pada service account produksi: aplikasi hanya memerlukan create/read untuk koleksi audit sejauh arsitektur memungkinkan; pisahkan akun untuk operasi retensi/arsip; ekspor audit ke penyimpanan dengan retention lock/WORM bila diwajibkan kebijakan organisasi. Uji bahwa kredensial runtime tidak dapat menghapus atau mengubah audit lama. Hash di aplikasi saja bukan pengganti IAM/WORM.

### Backup, restore, retensi, dan incident response

Sebelum produksi, dokumentasikan dan buktikan:

- backup Firestore terenkripsi dengan jadwal, retensi, pemilik, dan lokasi yang disetujui;
- restore drill berkala ke project non-produksi, termasuk verifikasi jumlah dokumen dan akses;
- retensi/penghapusan data anak dan bukti pemenuhan permintaan subjek data;
- prosedur insiden: triase, containment, rotasi kredensial, pemulihan, dokumentasi, dan notifikasi sesuai kewajiban organisasi;
- monitoring kegagalan autentikasi, lonjakan 429, kegagalan enkripsi, dan aktivitas administratif.

### Enkripsi field

Saat ini implementasi guardian menyimpan `contactEncrypted`, tetapi jangan menganggap seluruh PII/PHI telah terenkripsi. Inventarisasi field sensitif, seluruh jalur create/update/read/export, kebutuhan dekripsi, rotasi key, dan migrasi data lama. Jangan mengganti `FIELD_ENCRYPTION_KEY` pada produksi tanpa prosedur rotasi dan uji pemulihan.

## Dampak rate limit

Baseline 120 write per user per 60 detik diterapkan pada API yang memakai `requireAuth()`. Integrasi sinkronisasi batch di masa depan harus memiliki batas batch dan strategi retry/backoff; jangan menaikkan limit tanpa pengujian beban. Dokumen `_rate_limits` perlu kebijakan TTL/retensi operasional.

## Verifikasi lokal

```bash
npm run typecheck
npm test
npm run build
npm run emulators
```

Build/test yang lulus tidak menggantikan Firebase Emulator Rules tests, restore drill, review IAM, atau validasi keamanan independen.
