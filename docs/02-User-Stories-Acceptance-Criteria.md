# 02 — User Stories & Acceptance Criteria

## A. Orang tua/wali

### US-P01 — Melihat profil anak
Sebagai orang tua, saya ingin melihat profil anak agar dapat memastikan identitas dan riwayat yang ditampilkan benar.
**Acceptance criteria**
- Hanya wali terotorisasi yang dapat membuka profil.
- Profil menampilkan identitas minimum, Posyandu terdaftar, dan riwayat.
- Data sensitif tidak tampil pada halaman publik atau tautan tanpa autentikasi.

### US-P02 — Memantau grafik pertumbuhan
Sebagai orang tua, saya ingin melihat grafik pertumbuhan dari waktu ke waktu.
**Acceptance criteria**
- Grafik hanya menggunakan pengukuran dengan status terverifikasi.
- Tiap titik menampilkan tanggal dan nilai.
- Standar/indikator yang digunakan dijelaskan.
- Data tidak cukup menghasilkan status “data belum cukup”, bukan kesimpulan.

### US-P03 — Melihat pengingat
Sebagai orang tua, saya ingin melihat jadwal kunjungan/imunisasi agar tidak lupa.
**Acceptance criteria**
- Jadwal memiliki sumber, versi, dan tanggal berlaku.
- Pengingat hanya berasal dari jadwal yang telah disahkan.
- Sistem membedakan “belum tercatat” dan “belum diberikan”.
- Wali dapat mengatur preferensi notifikasi.

### US-P04 — Meminta koreksi
Sebagai orang tua, saya ingin melaporkan ketidaksesuaian data tanpa mengubah catatan resmi.
**Acceptance criteria**
- Tersedia tombol ajukan koreksi.
- Permintaan masuk ke antrean petugas.
- Catatan resmi tidak berubah sebelum ditinjau.
- Status permintaan dapat dipantau.

## B. Kader

### US-K01 — Registrasi anak
Sebagai kader, saya ingin mendaftarkan anak dan wali.
**Acceptance criteria**
- Nomor registrasi internal unik pada Posyandu.
- Tanggal lahir dan jenis kelamin divalidasi.
- Persetujuan/pemberitahuan privasi dicatat.
- Sistem memberi peringatan potensi data ganda.

### US-K02 — Mencatat pengukuran
Sebagai kader, saya ingin mencatat hasil pengukuran.
**Acceptance criteria**
- Berat dan tinggi/panjang memiliki satuan jelas.
- Sistem memeriksa nilai kosong, format, dan rentang teknis.
- Input yang janggal diberi flag verifikasi, bukan otomatis diubah.
- Catatan menyimpan petugas, waktu, dan status.

### US-K03 — Mencatat imunisasi/vitamin
Sebagai kader, saya ingin mencatat layanan yang diberikan.
**Acceptance criteria**
- Jenis layanan dipilih dari daftar yang dapat diperbarui.
- Tanggal dan petugas wajib dicatat.
- Sistem tidak menebak layanan dari usia.
- Jadwal berikutnya hanya ditampilkan jika aturan tervalidasi.

### US-K04 — Meninjau daftar tugas
Sebagai kader, saya ingin melihat data yang belum lengkap dan menunggu verifikasi.
**Acceptance criteria**
- Dashboard memfilter status dan periode.
- Klik item membuka catatan terkait.
- Data agregat tidak menampilkan informasi anak yang tidak diperlukan.

## C. Tenaga kesehatan/reviewer

### US-T01 — Memverifikasi catatan
Sebagai petugas berwenang, saya ingin memeriksa dan mengesahkan catatan.
**Acceptance criteria**
- Hanya peran yang diberi kewenangan dapat memverifikasi.
- Sistem menyimpan siapa, kapan, dan keputusan verifikasi.
- Penolakan verifikasi wajib memiliki alasan.

### US-T02 — Mengelola versi referensi
Sebagai reviewer, saya ingin memperbarui jadwal dan materi resmi.
**Acceptance criteria**
- Setiap versi memiliki sumber resmi, tanggal berlaku, tanggal review, dan reviewer.
- Versi lama tetap dapat ditelusuri.
- Perubahan tidak mengubah histori catatan yang telah terjadi.
- Perubahan dipublikasikan setelah persetujuan.

## D. Administrator Posyandu

### US-A01 — Mengelola kegiatan
Sebagai admin, saya ingin membuat kegiatan Posyandu dan daftar hadir.
**Acceptance criteria**
- Kegiatan memiliki nama, tanggal, lokasi, penanggung jawab.
- Daftar hadir dapat diekspor.
- Perubahan kegiatan tercatat.

### US-A02 — Membuat rekap
Sebagai admin, saya ingin membuat laporan per periode.
**Acceptance criteria**
- Filter tanggal tersedia.
- Laporan agregat tidak mengekspos identitas anak.
- Ekspor detail memerlukan hak akses khusus.
- Total laporan konsisten dengan data sumber.

## E. AI

### US-AI01 — Membuat ringkasan kunjungan
Sebagai orang tua, saya ingin ringkasan kunjungan dengan bahasa sederhana.
**Acceptance criteria**
- Hanya data terverifikasi yang menjadi sumber ringkasan.
- Ringkasan memisahkan fakta tercatat, hasil kalkulasi, dan edukasi.
- Tidak ada diagnosis atau resep.
- Ringkasan menyertakan waktu pembentukan dan data sumber.
- Jika data tidak cukup, sistem menyatakan keterbatasan.

### US-AI02 — Memberikan edukasi kontekstual
Sebagai orang tua, saya ingin memperoleh tips yang relevan dengan kebutuhan edukasi.
**Acceptance criteria**
- Tips berasal dari materi yang telah disetujui.
- Tips tidak menyatakan defisiensi zat gizi tanpa pemeriksaan yang sesuai.
- Ada tautan/sumber dan tanggal review.
- Kondisi berisiko diarahkan ke tenaga kesehatan.

### US-AI03 — Chatbot RAG (opsional)
Sebagai pengguna, saya ingin bertanya tentang panduan Posyandu.
**Acceptance criteria**
- Jawaban menggunakan dokumen knowledge base yang disetujui.
- Jawaban menampilkan referensi.
- Jika tidak ada sumber memadai, chatbot mengatakan tidak menemukan jawaban.
- Pertanyaan diagnosis/dosis/keputusan klinis dialihkan ke tenaga kesehatan.
