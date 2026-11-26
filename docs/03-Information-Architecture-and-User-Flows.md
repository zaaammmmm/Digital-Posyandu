# 03 — Information Architecture & User Flows

## 1. Struktur navigasi

### Portal Orang Tua
- Beranda
- Profil Anak
- Pertumbuhan
  - Grafik
  - Riwayat Pengukuran
- Imunisasi & Vitamin
  - Riwayat
  - Jadwal
- Ringkasan & Edukasi
- Notifikasi
- Ajukan Koreksi
- Pengaturan Akun & Privasi

### Portal Kader
- Dashboard
- Data Sasaran
  - Daftar Anak
  - Registrasi Anak
  - Profil Anak
- Pelayanan Posyandu
  - Kunjungan Baru
  - Pengukuran
  - Imunisasi
  - Vitamin/Suplemen
  - Pemantauan Tumbuh Kembang
- Verifikasi / Koreksi
- Jadwal Kegiatan
- Kunjungan Rumah
- Rekap
- Panduan Kader

### Portal Admin Posyandu
- Dashboard
- Profil Posyandu
- Pengguna & Peran
- Buku Administrasi
  - Buku Tamu
  - Buku Kegiatan
  - Buku Kas
  - Inventaris
  - Daftar Hadir Kader
  - Notulen
  - Kunjungan Rumah
  - Daftar Bantuan
- Register
  - Bayi/Balita
  - Ibu Hamil (fase berikutnya bila tervalidasi)
- Laporan
- Pengaturan & Audit

### Portal Reviewer Tenaga Kesehatan
- Antrean Verifikasi
- Tinjau Catatan
- Referensi Pertumbuhan
- Katalog Imunisasi
- Materi Edukasi
- Riwayat Persetujuan

## 2. Flow: kunjungan Posyandu
1. Kader login.
2. Pilih kegiatan Posyandu aktif.
3. Cari anak atau registrasi baru.
4. Konfirmasi identitas dengan wali.
5. Pilih “Buat kunjungan”.
6. Isi pengukuran dan layanan.
7. Simpan draft / kirim untuk verifikasi.
8. Petugas meninjau.
9. Jika valid, tandai terverifikasi.
10. Sistem memperbarui grafik, riwayat, dan ringkasan.
11. Orang tua menerima notifikasi bila kanal diaktifkan.

## 3. Flow: ringkasan AI
1. Data kunjungan berubah menjadi status terverifikasi.
2. Sistem mengambil field yang diizinkan.
3. Mesin aturan menghitung indikator pertumbuhan menggunakan referensi tervalidasi.
4. Sistem mengambil materi edukasi relevan dari knowledge base.
5. AI menyusun bahasa ringkasan dari fakta dan materi yang diberikan.
6. Safety checker memeriksa diagnosis, resep, klaim yang tidak didukung, dan kebocoran data.
7. Jika lolos, ringkasan ditampilkan.
8. Jika gagal, tampilkan ringkasan template non-AI atau pesan “ringkasan belum tersedia”.
9. Simpan versi prompt/model, sumber, waktu, dan hasil safety check sesuai kebijakan.

## 4. Flow: permintaan koreksi
1. Orang tua memilih catatan.
2. Isi alasan dan informasi yang dianggap tidak sesuai.
3. Sistem membuat tiket koreksi.
4. Kader/petugas berwenang meninjau.
5. Jika diterima, catatan diperbarui melalui versi baru.
6. Sistem menyimpan nilai lama, nilai baru, alasan, reviewer, dan waktu.
7. Orang tua menerima status permintaan.

## 5. Flow: pengingat
1. Jadwal layanan berasal dari katalog yang disetujui.
2. Sistem menghubungkan aturan jadwal dengan profil anak.
3. Petugas memeriksa pengecualian/riwayat yang relevan.
4. Pengingat ditampilkan kepada wali.
5. Jika ada ketidakpastian, tampilkan “konfirmasi dengan Posyandu/Puskesmas”, bukan tanggal pasti.

## 6. Flow: rekap
1. Admin memilih Posyandu dan periode.
2. Sistem menghitung metrik agregat.
3. Admin melihat pratinjau.
4. Ekspor hanya tersedia sesuai hak akses.
5. Aktivitas ekspor dicatat pada audit log.
