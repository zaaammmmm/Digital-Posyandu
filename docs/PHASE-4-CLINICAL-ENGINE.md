# Phase 4 — Core Health Service

## Batas aman implementasi

- WHO Z-score tetap `null` sampai dataset referensi resmi, metadata provenance, checksum, persetujuan klinis, dan golden test suite tersedia.
- `assessReferenceReadiness` memeriksa metadata, bukan mengesahkan validitas klinis dataset.
- Jadwal imunisasi hanya dapat dipilih jika status `approved` dan seluruh metadata sumber/versi/persetujuan lengkap.
- Tidak ada tanggal atau dosis imunisasi contoh yang diperlakukan sebagai aturan resmi.

## Aktivasi produksi

1. Dapatkan dataset dan standar resmi yang berlaku dari sumber berwenang.
2. Simpan manifest, checksum SHA-256, tanggal efektif, versi, dan sumber dokumen.
3. Minta tenaga kesehatan berwenang menyetujui dataset dan golden test cases.
4. Jalankan golden tests pada seluruh indikator, jenis kelamin, rentang usia, serta metode pengukuran.
5. Lakukan validasi independen sebelum mengaktifkan kalkulasi.
6. Pastikan hasil menyimpan versi referensi dan versi engine yang digunakan.

Patch ini sengaja tidak mengisi LMS/WHO table atau katalog imunisasi dengan angka ilustratif.
