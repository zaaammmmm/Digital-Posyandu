# 05 — AI Summary & Optional RAG Safety Specification

## 1. Strategi AI

AI bukan fitur utama untuk menentukan status kesehatan. Nilai AI adalah membantu mengubah catatan terstruktur menjadi informasi yang lebih mudah dipahami. Semua angka, klasifikasi pertumbuhan, dan jadwal harus dihitung oleh aturan deterministik atau berasal dari referensi resmi yang disahkan.

### Pembagian tanggung jawab
| Komponen | Tanggung jawab |
|---|---|
| Database | Menyimpan catatan asli dan status verifikasi |
| Rules/calculation service | Menghitung umur, indikator, tren, dan jadwal berdasarkan aturan berversi |
| Knowledge base | Menyediakan materi edukasi yang telah ditinjau |
| LLM | Menyusun narasi ringkasan dari fakta yang sudah disiapkan |
| Safety layer | Menolak klaim tidak didukung, diagnosis, resep, dan kebocoran |
| Human reviewer | Menyetujui aturan, referensi, dan materi klinis |

## 2. Kapan ringkasan dibuat
- Setelah kunjungan berstatus `verified`.
- Setelah koreksi terverifikasi, ringkasan lama ditandai kedaluwarsa dan dibuat ulang.
- Tidak membuat ringkasan klinis dari data draft.
- Ringkasan harus menunjukkan waktu pembuatan dan versi data.

## 3. Struktur payload ke model
Kirim data minimum yang dibutuhkan. Hindari nama lengkap, nomor kontak, alamat, dan identifier langsung. Gunakan token internal sementara jika perlu.

Contoh payload konseptual:
```json
{
  "age_months": 18,
  "sex_for_reference": "female",
  "visit_date": "2026-11-12",
  "measurements": {
    "weight_kg": 10.2,
    "length_height_cm": 78.4,
    "measurement_type": "standing_height"
  },
  "previous_measurement": {
    "visit_date": "2026-10-12",
    "weight_kg": 10.0
  },
  "validated_assessments": [
    {
      "indicator": "WAZ",
      "value": null,
      "classification": "provided_by_validated_rules_engine",
      "reference_version": "approved-reference-version"
    }
  ],
  "verified_services": [],
  "next_approved_reminders": [],
  "approved_education_snippets": []
}
```
Nilai `null` di atas adalah placeholder, bukan nilai klinis. Model tidak boleh menghitung sendiri klasifikasi yang tidak disediakan.

## 4. Prompt behavior — ringkasan
Instruksi sistem konseptual:
- Gunakan hanya fakta pada payload.
- Pisahkan fakta terukur, hasil kalkulasi, dan edukasi.
- Jika informasi tidak ada, katakan tidak tersedia.
- Jangan menyimpulkan anemia, defisiensi zat besi, stunting, penyakit, atau penyebab klinis.
- Jangan memberi dosis atau instruksi terapi.
- Jangan mengubah jadwal atau data.
- Gunakan bahasa sederhana, tidak menakut-nakuti.
- Sarankan konsultasi dengan tenaga kesehatan untuk interpretasi klinis.
- Cantumkan sumber edukasi yang diberikan.
- Jangan mengungkap data identitas yang tidak dibutuhkan.

## 5. Contoh tips yang aman
**Aman:** “Materi edukasi Posyandu yang telah ditinjau menyarankan keluarga memberikan makanan beragam sesuai usia anak. Lihat panduan pemberian makan bayi dan anak pada sumber yang tercantum. Bila anak tampak lemas, sulit makan, atau orang tua memiliki kekhawatiran, konsultasikan dengan tenaga kesehatan.”

**Tidak aman:** “Berat badan anak rendah, berarti kekurangan zat besi. Berikan tablet/sirup zat besi sekian dosis.”

Tips tentang zat besi hanya boleh diberikan sebagai edukasi umum dari sumber resmi dan tidak boleh menyatakan anak mengalami defisiensi tanpa pemeriksaan/penilaian yang sesuai.

## 6. Safety checks
Sebelum menyimpan output:
- Apakah ada diagnosis atau dugaan penyakit yang tidak disediakan oleh tenaga kesehatan?
- Apakah ada dosis, resep, atau instruksi terapi?
- Apakah ada klaim sebab-akibat yang tidak didukung?
- Apakah ringkasan menyamakan “tidak tercatat” dengan “tidak dilakukan”?
- Apakah model memasukkan data yang tidak ada?
- Apakah sumber edukasi dapat ditelusuri?
- Apakah data pribadi berlebih muncul?
Jika salah satu pemeriksaan gagal, jangan tampilkan output model. Gunakan template ringkasan non-AI.

## 7. Optional chatbot RAG

### Knowledge base
- Buku KIA dan panduan Kemenkes yang berlaku.
- Panduan keterampilan dasar kader dan pengelolaan Posyandu.
- Regulasi resmi tentang jadwal imunisasi.
- Standar pertumbuhan WHO/Kemenkes.
- Materi edukasi gizi dan tumbuh kembang yang telah ditinjau.

### Pipeline
1. Dokumen resmi diperoleh dari sumber resmi.
2. Reviewer mencatat penerbit, URL, tanggal, versi, dan cakupan.
3. Dokumen diproses menjadi potongan teks dengan metadata halaman/bagian.
4. Embedding dan indeks dibuat.
5. Pertanyaan pengguna mengambil potongan relevan.
6. LLM menjawab hanya dari potongan yang tersedia.
7. UI menampilkan sumber dan tanggal.
8. Jika retrieval tidak memadai, sistem menyatakan tidak tahu dan mengarahkan ke petugas.

### Batasan chatbot
- Bukan konsultasi medis.
- Tidak memberi diagnosis, resep, dosis, atau rekomendasi tindakan klinis individual.
- Tidak menebak jadwal imunisasi yang belum dikonfigurasi.
- Tidak menjawab dengan sumber internet acak di luar knowledge base yang disetujui.
- Pertanyaan tentang gejala berat atau kondisi darurat harus diarahkan ke layanan kesehatan/darurat setempat, tanpa menunda pertolongan.

## 8. Privasi penggunaan AI
- Minimalkan data sebelum dikirim ke penyedia model.
- Jangan mengirim nama, alamat, nomor telepon, atau identitas langsung jika tidak diperlukan.
- Evaluasi kebijakan retensi dan penggunaan data penyedia AI.
- Dapatkan persetujuan/dasar pemrosesan yang sesuai.
- Sediakan fallback tanpa AI.
- Jangan gunakan data anak untuk melatih model.
- Catat provider, model, prompt version, sumber, dan safety status.
