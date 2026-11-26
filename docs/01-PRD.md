# 01 — Product Requirements Document (PRD)
## Digital Posyandu — Sistem Buku Posyandu dan Administrasi Terintegrasi

| Metadata | Detail |
|---|---|
| Nama produk (working title) | Digital Posyandu |
| Versi | 1.0 |
| Tanggal | 25 November 2026 |
| Status | Draft untuk kompetisi Web Development |
| Sub-tema | Smart Lifestyle & Digital Wellbeing |
| SDGs | SDG 3 — Good Health and Well-being |
| Platform | Responsive web application / PWA-ready |
| AI | Ringkasan data dan edukasi kontekstual; chatbot RAG opsional |
| Web3 | Tidak digunakan |
| Target awal | Satu Posyandu sebagai pilot, dengan kemungkinan multi-Posyandu |

---

## 1. Ringkasan Produk

Digital Posyandu adalah aplikasi web untuk mendigitalisasi proses pencatatan yang selama ini dilakukan menggunakan buku fisik di Posyandu. Sistem menggabungkan pencatatan identitas dan riwayat anak, hasil pengukuran pertumbuhan, imunisasi, vitamin/suplemen, pemantauan tumbuh kembang, administrasi kegiatan, kunjungan rumah, serta rekap layanan.

Nilai tambah utama produk adalah **AI-generated health record summary**: setelah data pengukuran dan layanan dicatat, sistem menyusun ringkasan yang mudah dipahami orang tua dan kader, menyoroti perubahan dari kunjungan sebelumnya, menampilkan pengingat, serta menyajikan materi edukasi yang relevan dari sumber terverifikasi. AI tidak mendiagnosis, tidak menyimpulkan defisiensi zat besi hanya dari berat/tinggi, dan tidak meresepkan suplemen atau terapi.

Chatbot berbasis Retrieval-Augmented Generation (RAG) merupakan fitur opsional tahap lanjutan. Chatbot hanya menjawab berdasarkan knowledge base yang telah ditinjau, menampilkan sumber, dan mengarahkan pertanyaan berisiko kepada tenaga kesehatan.

### 1.1 Pernyataan nilai
“Catatan Posyandu yang lebih rapi, riwayat tumbuh kembang yang mudah dipantau, dan informasi tindak lanjut yang lebih mudah dipahami keluarga.”

### 1.2 Masalah yang diselesaikan
- Catatan kertas berisiko rusak, hilang, tercecer, atau sulit dicari kembali.
- Riwayat pertumbuhan anak tersebar di beberapa lembar/buku sehingga tren sulit dilihat.
- Orang tua dapat lupa jadwal kunjungan atau imunisasi.
- Kader perlu mengulang pencatatan dan rekap manual.
- Informasi hasil pengukuran belum selalu disampaikan dalam bentuk ringkasan yang mudah dipahami.
- Administrasi Posyandu dan bahan panduan kader tersimpan terpisah.

---

## 2. Visi, Tujuan, dan Bukan Tujuan

### 2.1 Visi
Mendukung layanan Posyandu yang lebih tertib, mudah ditelusuri, dan berorientasi pada kesinambungan pemantauan keluarga.

### 2.2 Tujuan produk
1. Mengurangi ketergantungan pada pencatatan kertas tanpa menghilangkan proses verifikasi oleh petugas.
2. Menyediakan profil dan riwayat anak yang dapat diakses sesuai kewenangan.
3. Menampilkan tren berat badan, panjang/tinggi badan, dan indikator pertumbuhan sesuai standar yang tervalidasi.
4. Membantu keluarga mengingat jadwal kunjungan dan imunisasi.
5. Memudahkan kader mencatat pelayanan dan menghasilkan rekap Posyandu.
6. Menyediakan administrasi dan dokumentasi kegiatan secara digital.
7. Mengubah catatan terstruktur menjadi ringkasan dan edukasi yang mudah dipahami, dengan kontrol keselamatan yang ketat.

### 2.3 Bukan tujuan / Non-goals
- Mendiagnosis stunting, wasting, anemia, defisiensi zat besi, atau penyakit lain secara mandiri.
- Menggantikan Buku KIA, Puskesmas, dokter, bidan, ahli gizi, atau keputusan tenaga kesehatan.
- Memberikan resep, dosis obat, dosis suplemen, atau perubahan jadwal imunisasi berdasarkan generasi AI.
- Menjadi sistem rekam medis elektronik fasilitas kesehatan tanpa proses integrasi, tata kelola, dan kepatuhan yang sesuai.
- Mengklaim integrasi dengan SATUSEHAT atau sistem pemerintah lain sebelum tersedia persetujuan dan API resmi.
- Menyimpan seluruh data lintas enam bidang SPM pada MVP. Fokus awal adalah alur Posyandu bidang kesehatan dan administrasi operasional yang diberikan pengguna.
- Mengotomatisasi perubahan data yang sudah diverifikasi petugas.

---

## 3. Pengguna dan Peran

| Peran | Kebutuhan utama | Hak akses utama |
|---|---|---|
| Orang tua/wali | Melihat profil anak, riwayat, jadwal, dan ringkasan | Hanya anak yang menjadi tanggung jawabnya |
| Kader Posyandu | Registrasi, pencatatan kunjungan, pengukuran, layanan, rekap | Data Posyandu yang ditugaskan |
| Bidan/tenaga kesehatan/Puskesmas | Meninjau data, memvalidasi tindak lanjut, mengoreksi catatan sesuai kewenangan | Data layanan sesuai wilayah/tugas |
| Ketua/administrator Posyandu | Mengelola anggota, kegiatan, administrasi, dan laporan | Data operasional Posyandu |
| Pengelola sistem | Mengelola konfigurasi teknis dan akun | Akses administratif terbatas; akses data kesehatan tidak otomatis |
| Reviewer konten kesehatan | Menyetujui materi edukasi dan aturan ringkasan | Knowledge base dan versi aturan, bukan seluruh data anak |

**Prinsip least privilege:** pengguna hanya memperoleh akses minimum yang dibutuhkan untuk tugasnya. Peran pengelola sistem tidak otomatis berhak membaca catatan kesehatan.

---

## 4. Ruang Lingkup Produk

### 4.1 Modul inti — MVP

**A. Manajemen Posyandu**
- Profil Posyandu: nama, alamat/area, jadwal layanan, kontak, wilayah kerja.
- Manajemen akun dan penugasan peran.
- Daftar kader dan tenaga kesehatan pendamping.
- Pengelompokan data berdasarkan Posyandu.

**B. Profil anak dan keluarga**
- Identitas anak: nama, tanggal lahir, jenis kelamin, nomor registrasi internal.
- Data wali: nama, hubungan, kontak yang diperlukan.
- Alamat cukup pada tingkat yang dibutuhkan operasional.
- Riwayat kunjungan dan catatan layanan.
- Persetujuan/wali dan informasi privasi.
- Penanda data perlu verifikasi bila ada ketidaksesuaian.

**C. Pencatatan kunjungan dan antropometri**
- Tanggal kunjungan dan petugas pencatat.
- Berat badan (kg).
- Panjang badan atau tinggi badan (cm), sesuai usia dan prosedur pengukuran.
- Lingkar lengan atas (bila memang menjadi bagian formulir dan divalidasi).
- Lingkar kepala (bila dibutuhkan dan divalidasi).
- Catatan pengukuran, metode/alat, dan status verifikasi.
- Validasi input: satuan, rentang teknis yang wajar, tanggal, duplikasi.
- Riwayat dan grafik berdasarkan waktu.
- Penanda pengukuran yang perlu diperiksa ulang, bukan label diagnosis.

**D. Interpretasi pertumbuhan**
- Plot indikator yang disepakati terhadap standar pertumbuhan WHO/Kemenkes yang berlaku.
- Minimal dukungan indikator: berat-menurut-umur (WAZ), panjang/tinggi-menurut-umur (LAZ/HAZ), dan berat-menurut-panjang/tinggi (WLZ/WHZ), jika data dan metode perhitungan tervalidasi.
- Jenis kelamin, umur tepat, dan metode panjang/tinggi menjadi input penting.
- Tampilkan sumber standar, versi tabel/algoritma, tanggal pembaruan, dan status validasi.
- Interpretasi tidak boleh dihasilkan dari LLM bebas. Perhitungan dilakukan oleh modul deterministik tervalidasi; AI hanya menjelaskan hasil yang telah dihasilkan modul tersebut.
- Jika input tidak lengkap atau pengukuran meragukan, tampilkan “perlu verifikasi” dan jangan menampilkan kesimpulan.

**E. Imunisasi dan vitamin/suplemen**
- Daftar imunisasi yang relevan dengan umur dan status catatan.
- Riwayat vaksin: jenis, tanggal, dosis/urutan, lokasi, pencatat/pemberi, dan bukti/catatan.
- Jadwal berikutnya berdasarkan katalog jadwal yang telah disahkan tenaga kesehatan.
- Catatan vitamin/suplemen: jenis, tanggal, pemberian, dan petugas; detail dosis hanya bila formulir resmi dan otorisasi mengharuskan.
- Pengingat kepada wali untuk jadwal yang telah dikonfirmasi.
- Status “belum tercatat” tidak boleh otomatis diartikan “belum diberikan”.
- Jadwal imunisasi harus dapat diperbarui dan memiliki versi; jangan hard-code tanpa mekanisme revisi.

**F. Pemantauan tumbuh kembang**
- Catatan hasil skrining/perkembangan berdasarkan instrumen resmi yang digunakan oleh petugas.
- Tanggal, petugas, instrumen/versi, hasil, dan tindak lanjut.
- Sistem hanya menampilkan hasil dan alur rujukan yang disetujui; bukan mendiagnosis keterlambatan perkembangan.

**G. Dashboard kader**
- Ringkasan jumlah anak terdaftar, kunjungan hari ini, pengukuran belum lengkap, data menunggu verifikasi, dan jadwal tindak lanjut.
- Pencarian cepat berdasarkan nama/nomor registrasi internal.
- Daftar tugas tindak lanjut.
- Rekap per periode.

**H. Rekap per Posyandu**
- Jumlah sasaran dan kunjungan.
- Cakupan pengukuran/layanan sesuai indikator yang telah disepakati.
- Daftar kunjungan dan aktivitas.
- Ekspor CSV/PDF dengan kontrol hak akses.
- Rekap agregat untuk presentasi; hindari menampilkan identitas anak pada laporan umum.

**I. Administrasi Posyandu**
Digitalisasi buku yang disebutkan dalam kebutuhan:
- Buku tamu.
- Buku kegiatan.
- Buku kas.
- Buku inventaris.
- Daftar hadir kader.
- Buku notulen.
- Buku kunjungan rumah.
- Daftar bantuan.
- Register bayi/balita dan ibu hamil (sesuaikan format resmi lokal).
- Arsip dokumen dan lampiran.
Setiap jenis buku memiliki tanggal, penanggung jawab, status, lampiran opsional, dan jejak perubahan. Untuk MVP, administrasi dapat dimulai dari buku kegiatan, daftar hadir, notulen, kunjungan rumah, dan inventaris; modul kas/bantuan memerlukan validasi format dan kebijakan pengelolaan.

**J. Pusat panduan kader**
- Materi panduan keterampilan dasar kader.
- Materi layanan Posyandu bidang kesehatan.
- Materi enam bidang SPM sebagai referensi/tautan, bukan klaim bahwa semua layanan SPM telah dikelola aplikasi.
- Pencarian berdasarkan topik.
- Metadata sumber, penerbit, tanggal, versi, dan tanggal review.
- Materi kesehatan hanya dapat diterbitkan setelah review pihak berwenang.

### 4.2 Fitur AI — nilai tambah utama
- Ringkasan otomatis setelah data kunjungan disimpan dan diverifikasi.
- Perbandingan perubahan dari kunjungan sebelumnya.
- Ringkasan jadwal layanan yang sudah tercatat dan pengingat berikutnya.
- Edukasi kontekstual berbasis data dan materi yang disetujui.
- Penjelasan bahasa sederhana untuk orang tua.
- Penjelasan operasional untuk kader.

### 4.3 Fitur opsional — chatbot RAG
- Tanya jawab tentang materi Posyandu, imunisasi, gizi, dan panduan kader.
- Jawaban bersumber dari knowledge base yang telah disetujui.
- Menampilkan judul sumber dan tanggal/versi.
- Menolak atau mengalihkan permintaan diagnosis, resep, dosis, dan keputusan klinis.
- Tidak menggunakan data anak untuk menjawab pertanyaan umum kecuali ada kebutuhan, dasar pemrosesan, dan kontrol akses yang jelas.

---

## 5. Alur Operasional Utama

### 5.1 Sebelum hari Posyandu
1. Administrator membuat jadwal kegiatan.
2. Sistem menyiapkan daftar sasaran dan pengingat kunjungan.
3. Orang tua menerima pengingat melalui kanal yang tersedia dan telah disetujui.
4. Kader melihat daftar sasaran dan kebutuhan tindak lanjut.

### 5.2 Saat kunjungan
1. Kader mencari anak berdasarkan nomor registrasi/nama.
2. Kader memastikan identitas anak dan wali.
3. Kader membuat catatan kunjungan baru.
4. Pengukuran dilakukan secara fisik sesuai prosedur.
5. Kader memasukkan hasil pengukuran dan layanan.
6. Sistem memvalidasi kelengkapan dan kejanggalan teknis.
7. Kader menyimpan sebagai “Draft” atau “Menunggu verifikasi”.
8. Petugas berwenang memeriksa dan mengesahkan data.
9. Sistem menghasilkan grafik dan ringkasan setelah data berstatus terverifikasi.

### 5.3 Setelah kunjungan
1. Orang tua melihat ringkasan kunjungan.
2. Sistem menampilkan pengingat berikutnya jika jadwal telah disahkan.
3. Sistem menyajikan materi edukasi relevan.
4. Kader melihat daftar tindak lanjut dan rekap.
5. Koreksi data dilakukan melalui mekanisme koreksi dengan alasan dan audit trail, bukan menghapus jejak lama.

### 5.4 Ketidaksesuaian catatan
- Orang tua dapat mengajukan “minta koreksi” atau menghubungi Posyandu.
- Orang tua tidak mengubah catatan pengukuran yang telah disahkan.
- Kader tidak mengubah data terverifikasi tanpa alasan dan hak akses yang sesuai.
- Koreksi menyimpan nilai lama, nilai baru, alasan, waktu, dan identitas petugas.
- Catatan asli tetap dapat ditelusuri.

---

## 6. Kebutuhan Fungsional

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Sistem mendukung login dan otorisasi berbasis peran | Must |
| FR-02 | Admin dapat membuat dan mengelola profil Posyandu | Must |
| FR-03 | Kader dapat mendaftarkan anak dan wali | Must |
| FR-04 | Kader dapat membuat catatan kunjungan | Must |
| FR-05 | Kader dapat mencatat antropometri dengan satuan dan validasi | Must |
| FR-06 | Sistem menyimpan riwayat pengukuran per anak | Must |
| FR-07 | Sistem menampilkan grafik tren pertumbuhan | Must |
| FR-08 | Sistem menampilkan interpretasi hanya dari algoritma/standar tervalidasi | Must |
| FR-09 | Sistem mencatat imunisasi dan vitamin/suplemen | Must |
| FR-10 | Sistem menghitung/mengambil jadwal imunisasi dari katalog berversi yang disahkan | Must |
| FR-11 | Sistem menyediakan pengingat jadwal | Should |
| FR-12 | Sistem menyediakan dashboard kader | Must |
| FR-13 | Sistem menyediakan rekap per Posyandu | Must |
| FR-14 | Sistem menyediakan administrasi dasar (kegiatan, hadir, notulen, kunjungan rumah) | Should |
| FR-15 | Sistem menyediakan pusat panduan kader | Should |
| FR-16 | Sistem membuat ringkasan AI dari data terverifikasi | Must untuk diferensiasi demo; dapat dibatasi |
| FR-17 | Sistem menyediakan permintaan koreksi dan audit trail | Must |
| FR-18 | Sistem menyediakan ekspor laporan sesuai hak akses | Should |
| FR-19 | Sistem dapat menyimpan draft saat koneksi terganggu dan menyinkronkan dengan aman | Could |
| FR-20 | Chatbot RAG berbasis knowledge base terverifikasi | Could / fase berikutnya |

---

## 7. Kebutuhan Non-Fungsional

### Keamanan dan privasi
- TLS untuk seluruh komunikasi.
- Enkripsi data sensitif saat tersimpan.
- Password di-hash dengan algoritma modern.
- RBAC dan pemeriksaan otorisasi pada server untuk setiap resource.
- Audit log untuk akses dan perubahan catatan penting.
- Session management aman, proteksi CSRF/XSS/SQL injection, rate limiting.
- Backup terenkripsi dan uji pemulihan.
- Kebijakan retensi, penghapusan, ekspor, dan penanganan insiden.
- Persetujuan wali dan pemberitahuan privasi yang mudah dipahami.
- Data anak dan informasi kesehatan diperlakukan sebagai data pribadi spesifik sesuai UU PDP.
- Gunakan data sintetis pada pengembangan, pengujian, dan demo.

### Kinerja dan ketersediaan
- Halaman dashboard utama dimuat dalam target 3 detik pada kondisi jaringan uji yang ditentukan.
- Pencarian anak memberi hasil dalam target 2 detik untuk dataset pilot.
- Formulir tetap dapat digunakan pada layar ponsel.
- Penanganan error jelas dan tidak menghilangkan input yang belum tersimpan.

### Usability dan aksesibilitas
- Bahasa Indonesia sederhana.
- Desain mobile-first karena pencatatan dapat dilakukan di lapangan.
- Ukuran tombol dan label memadai.
- Formulir dibagi per bagian dan menampilkan satuan dengan jelas.
- Warna status tidak menjadi satu-satunya pembeda.
- Grafik memiliki legenda dan penjelasan tekstual.
- Tidak menggunakan istilah diagnosis yang belum disahkan.

### Integritas data
- Catatan terverifikasi tidak dapat diubah tanpa alur koreksi.
- Setiap pengukuran memiliki waktu, pencatat, sumber, dan status verifikasi.
- Mencegah duplikasi kunjungan dan konflik sinkronisasi.
- Data hasil perhitungan menyimpan versi algoritma/standar yang digunakan.

---

## 8. Status Data dan Alur Verifikasi

Status yang disarankan:
- **Draft** — belum dikirim.
- **Menunggu Verifikasi** — telah dikirim, belum disahkan.
- **Terverifikasi** — diperiksa dan disahkan petugas berwenang.
- **Perlu Koreksi** — terdapat masalah yang harus diperbaiki.
- **Dikoreksi** — koreksi telah dilakukan dan memiliki jejak audit.
- **Dibatalkan** — entri dibatalkan dengan alasan; tidak dihapus permanen.

AI hanya memproses data terverifikasi. Jika ringkasan menggunakan data draft, tampilkan label “belum diverifikasi” dan jangan menyajikan interpretasi kesehatan.

---

## 9. Spesifikasi Ringkasan AI

### 9.1 Input yang diperbolehkan
- Data profil minimum yang relevan (usia, jenis kelamin jika diperlukan untuk standar).
- Pengukuran terverifikasi.
- Hasil perhitungan antropometri dari modul deterministik.
- Riwayat layanan/imunisasi yang terverifikasi.
- Jadwal yang telah disahkan.
- Materi edukasi dari knowledge base yang disetujui.

### 9.2 Output
Ringkasan terdiri dari:
1. **Ringkasan kunjungan:** tanggal, pengukuran, layanan yang dicatat.
2. **Perubahan dari kunjungan sebelumnya:** nilai dan selisih numerik, tanpa menyebut perubahan sebagai baik/buruk secara otomatis.
3. **Informasi pertumbuhan:** interpretasi dari modul standar tervalidasi, dengan konteks dan disclaimer.
4. **Pengingat:** jadwal berikutnya yang bersumber dari katalog resmi dan sudah disahkan.
5. **Edukasi relevan:** tips umum yang sesuai usia/konteks dan bersumber dari materi terverifikasi.
6. **Tindak lanjut:** misalnya “diskusikan hasil ini dengan bidan/kader” jika ada flag dari aturan klinis yang disetujui.

### 9.3 Larangan AI
- Tidak boleh menyatakan “anak kekurangan zat besi/anemia” hanya dari tinggi dan berat badan.
- Tidak boleh mengarang kekurangan zat gizi, diagnosis, atau penyebab perubahan pertumbuhan.
- Tidak boleh memberi dosis obat/suplemen atau mengubah jadwal vaksin.
- Tidak boleh menyarankan penghentian layanan medis.
- Tidak boleh menyimpulkan data hilang sebagai hasil normal.
- Tidak boleh mengubah catatan atau status verifikasi.
- Tidak boleh membuat klaim pasti dari satu titik pengukuran.

### 9.4 Contoh output aman
“Pada kunjungan 12 November 2026, berat badan tercatat 10,2 kg dan tinggi badan 78,4 cm. Dibandingkan kunjungan 12 Oktober 2026, berat badan tercatat bertambah 0,2 kg. Grafik menunjukkan posisi pengukuran berdasarkan standar pertumbuhan yang digunakan. Hasil ini merupakan informasi pemantauan, bukan diagnosis. Jika ada kekhawatiran atau hasil ditandai perlu ditinjau, konsultasikan dengan bidan atau tenaga kesehatan. Untuk dukungan pola makan, keluarga dapat membaca materi pemberian makan sesuai usia yang tersedia pada bagian Edukasi.”

Contoh tidak aman yang harus dicegah:
“Anak mengalami anemia karena beratnya rendah. Berikan suplemen zat besi 2 kali sehari.”
Alasan: anemia tidak dapat didiagnosis dari antropometri dan AI tidak boleh meresepkan.

---

## 10. Dashboard dan Laporan

### Dashboard kader
- Kunjungan hari ini.
- Anak yang belum memiliki pengukuran pada periode berjalan.
- Catatan menunggu verifikasi.
- Pengingat/tindak lanjut yang jatuh tempo.
- Ringkasan layanan berdasarkan periode.
- Aktivitas terbaru.

### Dashboard orang tua
- Profil anak.
- Kunjungan terakhir.
- Grafik pertumbuhan.
- Riwayat imunisasi dan status pencatatan.
- Jadwal berikutnya.
- Ringkasan AI dan edukasi.
- Tombol menghubungi Posyandu / mengajukan koreksi.

### Rekap Posyandu
- Periode laporan.
- Jumlah sasaran terdaftar.
- Jumlah kunjungan.
- Jumlah pengukuran yang tercatat.
- Kelengkapan catatan layanan.
- Aktivitas kader.
- Daftar tindak lanjut.
- Ekspor agregat dan ekspor detail dengan izin.

---

## 11. Asumsi dan Dependensi

- Terdapat satu Posyandu pilot yang bersedia memberi masukan.
- Kader/tenaga kesehatan dapat memvalidasi formulir dan alur pencatatan.
- Jadwal imunisasi dan standar pertumbuhan diambil dari sumber resmi terbaru, bukan hasil generasi AI.
- Sistem tidak diasumsikan terintegrasi dengan sistem nasional.
- Notifikasi bergantung pada kanal yang dipilih, persetujuan wali, dan ketersediaan layanan.
- Ketersediaan jaringan di lokasi belum tentu stabil; offline-first penuh bukan bagian MVP kecuali menjadi kebutuhan pilot.
- Penggunaan AI bergantung pada penyedia model, kebijakan pemrosesan data, biaya, dan persetujuan yang sesuai.

---

## 12. Kriteria Keberhasilan Produk

MVP dianggap berhasil bila:
- Kader dapat membuat profil anak dan mencatat kunjungan tanpa bantuan teknis.
- Riwayat pengukuran dapat dilihat dalam urutan waktu.
- Grafik menampilkan data dengan benar dan menyebut standar/versinya.
- Jadwal imunisasi berasal dari konfigurasi tervalidasi.
- Orang tua hanya dapat melihat anak yang menjadi tanggung jawabnya.
- Ringkasan AI menyebut data sumber dan tidak mengeluarkan diagnosis/resep.
- Koreksi data meninggalkan audit trail.
- Rekap per Posyandu dapat dihasilkan.
- Uji coba alur selesai dilakukan dengan kader dan tenaga kesehatan.
