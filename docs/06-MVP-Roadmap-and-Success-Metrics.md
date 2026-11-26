# 06 — MVP Roadmap & Success Metrics

## 1. Strategi prioritas

### MVP — wajib untuk demo yang kredibel
1. Login dan RBAC.
2. Profil Posyandu dan pengguna.
3. Registrasi anak dan wali (data dummy untuk demo).
4. Catatan kunjungan.
5. Input berat dan panjang/tinggi dengan validasi.
6. Riwayat dan grafik pertumbuhan.
7. Catatan imunisasi/vitamin.
8. Jadwal berbasis konfigurasi berversi (gunakan data contoh yang sudah direview; jangan klaim jadwal produksi jika belum divalidasi).
9. Dashboard kader.
10. Rekap Posyandu.
11. Ringkasan AI dengan guardrail dan fallback template.
12. Audit trail dan permintaan koreksi.

### Should — jika waktu memungkinkan
- Pengingat email/push/WhatsApp melalui provider resmi dan persetujuan.
- Buku kegiatan, daftar hadir, notulen, inventaris.
- Pusat panduan kader.
- Ekspor PDF/CSV.
- Draft lokal dan sinkronisasi sederhana.

### Could — pasca kompetisi
- Chatbot RAG.
- Kunjungan rumah yang lebih lengkap.
- Buku kas dan daftar bantuan.
- Register ibu hamil dan perluasan kelompok sasaran.
- Offline-first penuh.
- Integrasi sistem pemerintah jika ada izin dan API resmi.

## 2. Rencana sprint contoh (6 minggu)
| Sprint | Fokus | Deliverable |
|---|---|---|
| 0 | Validasi proses dan desain data | Peta alur, formulir, role matrix |
| 1 | Fondasi aplikasi | Auth, Posyandu, role |
| 2 | Profil dan pencatatan | Anak, wali, kunjungan, pengukuran |
| 3 | Monitoring | Grafik, aturan pertumbuhan tervalidasi, imunisasi |
| 4 | Operasional | Dashboard kader, rekap, administrasi dasar |
| 5 | AI dan hardening | Ringkasan aman, audit, uji keamanan, usability test |

## 3. Metrik keberhasilan pilot
Jangan menetapkan angka keberhasilan sebagai klaim sebelum baseline diukur. Target berikut adalah usulan untuk diuji:
- Waktu rata-rata pencatatan satu kunjungan.
- Persentase catatan yang lengkap.
- Persentase catatan yang perlu koreksi.
- Waktu untuk menemukan riwayat anak.
- Jumlah pengingat yang dilihat wali.
- Persentase wali yang memahami ringkasan (uji pemahaman sederhana).
- Kepuasan kader terhadap alur.
- Tingkat kesalahan input dan konflik data.
- Jumlah output AI yang ditolak safety checker.
- Jumlah insiden privasi/akses tidak sah (target: nol).

## 4. Rencana pengujian
- Unit test untuk validasi field, perhitungan umur, dan aturan.
- Golden test untuk algoritma pertumbuhan dengan dataset rujukan yang disahkan.
- Uji tanggal lahir dan batas usia.
- Uji role-based access dan akses lintas Posyandu.
- Uji koreksi dan audit trail.
- Uji prompt injection pada knowledge base RAG.
- Uji AI hallucination dan refusal.
- Uji usability dengan kader.
- Uji backup/restore.
- Uji aksesibilitas pada ponsel.

## 5. Demo story yang disarankan
1. Kader masuk ke dashboard Posyandu.
2. Kader membuka profil anak dummy.
3. Kader mencatat pengukuran pada kunjungan baru.
4. Petugas melakukan verifikasi.
5. Grafik memperlihatkan riwayat dan perubahan.
6. Ringkasan AI menjelaskan angka yang tercatat dan tips edukasi bersumber.
7. Orang tua melihat jadwal yang sudah dikonfigurasi.
8. Admin mengunduh rekap agregat.
9. Tunjukkan audit trail untuk membuktikan data tidak dapat diubah diam-diam.
