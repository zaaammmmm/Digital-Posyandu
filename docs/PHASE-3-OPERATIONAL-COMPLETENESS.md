# Phase 3 — Operational Completeness

Patch ini menambahkan fondasi operasional berikut pada baseline yang tersedia.

## Notifikasi dan pengingat
- `GET /api/notifications` mengembalikan daftar pekerjaan berdasarkan role dan tenant aktif.
- Halaman `/notifications` menampilkan antrean verifikasi untuk tenaga kesehatan, koreksi/penolakan untuk kader/admin, dan ketersediaan riwayat layanan untuk wali.
- Data notifikasi dihitung dari status operasional terkini, tidak disimpan sebagai salinan data klinis, dan tidak menjadi diagnosis atau rekomendasi klinis.

## Pemeriksaan data anak duplikat
- `/cadre/children/duplicates` dan `GET /api/children/duplicates` mencari kandidat berdasarkan kemiripan token nama serta tanggal lahir.
- Pencarian dibatasi ke tenant aktif, menampilkan metadata minimum, dan bersifat advisory. Tidak ada penggabungan atau penghapusan otomatis.
- Pencarian saat ini memeriksa maksimum 500 data pertama pada tenant. Untuk skala besar, implementasikan indeks pencarian khusus dan pagination.

## Administrasi lanjutan
- `PATCH /api/administration/records` mengizinkan pembaruan field yang diizinkan dengan audit before/after dalam transaksi.
- `DELETE /api/administration/records?id=...` hanya untuk `posyandu_admin` dan mencatat audit trail sebelum transaksi selesai.
- Tabel administrasi menyediakan aksi ubah untuk kader/admin dan hapus khusus admin Posyandu.
- Lampiran, buku kas, dan daftar bantuan tetap tidak termasuk karena memerlukan model data serta kontrol akses tersendiri.

## Laporan PDF
- Halaman `/admin/reports/print` menyajikan rekap agregat yang siap dicetak.
- Tombol **Cetak / Simpan PDF** memakai fitur print browser (pilih "Save as PDF"). Tidak membutuhkan dependency PDF server.
- Laporan tidak menampilkan identitas anak.

## Offline-first
- Form kunjungan memulihkan dan menyimpan draft lokal terenkripsi pada IndexedDB menggunakan helper offline yang sudah ada.
- Draft tidak dikirim otomatis. Pengiriman tetap memerlukan tindakan pengguna saat koneksi tersedia.
- Kunci saat ini berada di `sessionStorage`; draft mungkin tidak dapat dipulihkan setelah sesi browser berakhir. Ini merupakan trade-off keamanan yang disengaja, bukan sinkronisasi offline lintas sesi/perangkat.

## Deployment dan verifikasi
- Deploy indeks baru bersama Firestore indexes.
- Uji semua route dengan enam role, tenant berbeda, data kosong, dan dataset besar.
- Jalankan `npm run typecheck`, `npm test`, dan `npm run build`.
- Uji print pada Chrome/Firefox dan pastikan browser menyimpan PDF tanpa memuat identitas pribadi.
- Uji draft ketika offline, reload tab, sesi berakhir, submit berhasil, serta submit gagal. Tidak ada auto-retry untuk mencegah pengiriman ganda.
