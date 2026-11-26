# 07 — Risks, Assumptions & Field Validation

## 1. Risiko utama

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Standar pertumbuhan salah/versi usang | Interpretasi kesehatan keliru | Gunakan standar resmi berversi, golden test, review tenaga kesehatan |
| Jadwal imunisasi berubah | Pengingat salah | Katalog jadwal berversi, sumber resmi, reviewer, tanggal berlaku |
| Data anak bocor | Dampak privasi dan keselamatan tinggi | Minimasi data, enkripsi, RBAC, audit, consent, incident response |
| AI mengarang diagnosis/tips | Pengguna salah memahami kondisi | AI hanya merangkum fakta; safety filter; sumber edukasi; human escalation |
| Pengukuran tidak akurat | Grafik dan interpretasi menyesatkan | Prosedur pengukuran, input quality flags, verifikasi |
| Kader kesulitan memakai aplikasi | Adopsi rendah | Mobile-first, uji lapangan, bahasa sederhana, formulir singkat |
| Internet tidak stabil | Data gagal tersimpan | Autosave/draft, indikator status sinkronisasi, rencana offline bertahap |
| Format administrasi berbeda antarwilayah | Form tidak sesuai | Konfigurasi lokal dan validasi dengan Posyandu pilot |
| Ruang lingkup terlalu besar | MVP tidak selesai | Prioritaskan alur anak-kunjungan-pengukuran-imunisasi-ringkasan |
| Integrasi nasional tidak tersedia | Klaim produk berlebihan | Jangan klaim integrasi tanpa izin/API resmi |

## 2. Validasi wajib sebelum pilot
- [ ] Observasi satu hari pelayanan Posyandu.
- [ ] Wawancara minimal 1–2 kader.
- [ ] Wawancara bidan/tenaga kesehatan pendamping.
- [ ] Minta contoh formulir yang digunakan (hapus identitas pribadi).
- [ ] Konfirmasi indikator pengukuran dan cara pengukuran.
- [ ] Konfirmasi alur verifikasi dan koreksi catatan.
- [ ] Konfirmasi jadwal imunisasi yang berlaku di wilayah.
- [ ] Konfirmasi materi edukasi yang boleh ditampilkan.
- [ ] Konfirmasi format rekap yang dibutuhkan.
- [ ] Tinjau persetujuan wali, pemberitahuan privasi, retensi, dan akses data.
- [ ] Uji aplikasi menggunakan data dummy sebelum data nyata.

## 3. Pertanyaan wawancara kader
1. Buku apa saja yang benar-benar digunakan dalam satu kegiatan?
2. Siapa yang mengisi tiap buku dan kapan?
3. Data apa yang paling sering sulit dicari?
4. Bagaimana proses pencatatan dan koreksi jika salah tulis?
5. Bagaimana hasil pengukuran disampaikan kepada orang tua?
6. Siapa yang menetapkan tindak lanjut jika hasil perlu diperiksa?
7. Bagaimana jadwal imunisasi dicatat dan diperbarui?
8. Bagaimana rekap bulanan dibuat dan kepada siapa diserahkan?
9. Kendala apa yang muncul saat jaringan/perangkat tidak tersedia?
10. Apakah ada format lokal yang wajib dipertahankan?

## 4. Pertanyaan wawancara orang tua
1. Informasi apa yang paling ingin dilihat setelah kunjungan?
2. Apakah pengingat digital akan membantu?
3. Kanal pengingat apa yang disetujui dan nyaman?
4. Bagian mana dari grafik atau ringkasan yang membingungkan?
5. Bagaimana cara melaporkan jika catatan tidak sesuai?
6. Informasi apa yang tidak ingin dibagikan melalui aplikasi?

## 5. Asumsi yang belum terbukti
- Orang tua memiliki akses smartphone dan koneksi yang cukup.
- Kader bersedia menggunakan perangkat saat kegiatan.
- Format pencatatan dapat dipetakan ke formulir digital.
- Satu Posyandu dapat menjadi pilot dan memberi feedback.
- Pengingat digital memiliki kanal dan persetujuan yang memadai.
- AI dapat digunakan tanpa mengirim identitas langsung ke penyedia model.

Semua asumsi harus diuji. Jangan menyajikannya sebagai fakta dalam proposal.
