# Digital Posyandu — Acceptance & Release Checklist

Dokumen ini melengkapi PRD; ia tidak menggantikan validasi lapangan, persetujuan tenaga kesehatan, atau penilaian privasi.

## Phase 1 — Security & Authentication
- [ ] Login menggunakan Firebase Authentication; API memverifikasi ID token pada server.
- [ ] Role berasal dari membership aktif/claim terverifikasi, bukan nilai request body.
- [ ] Semua resource tenant dicek terhadap `x-posyandu-id` dan keanggotaan pengguna.
- [ ] Firestore Rules menolak akses tanpa membership dan akses lintas tenant.
- [ ] Enkripsi gagal tertutup bila kunci tidak tersedia; tidak ada default key.
- [ ] Uji token kedaluwarsa/dicabut, role tidak sah, tenant salah, dan akses parent ke anak lain.

## Phase 2 — Data Management
- [ ] CRUD Posyandu dibatasi admin tenant.
- [ ] Registrasi anak memiliki nomor internal unik per Posyandu.
- [ ] Data wali/contact disimpan dengan minimisasi dan enkripsi field kontak.
- [ ] Membership mempunyai role dan status aktif/nonaktif.
- [ ] Consent mencatat tujuan, versi pemberitahuan, status, waktu, dan wali.
- [ ] Uji duplikasi registrasi, validasi tanggal lahir, dan akses lintas tenant.

## Phase 3 — Core Health Service
- [ ] Kunjungan memakai identitas server dan Posyandu aktif, bukan identitas dari body.
- [ ] Umur dihitung dari tanggal lahir dan tanggal kunjungan.
- [ ] Pengukuran menyimpan satuan, metode, pencatat, waktu, dan quality flags.
- [ ] WHO engine tidak menghasilkan klasifikasi/Z-score sebelum referensi resmi berversi tersedia.
- [ ] Grafik hanya menampilkan pengukuran terverifikasi.
- [ ] Imunisasi dan vitamin dicatat sebagai event; jadwal hanya dari katalog yang disahkan.
- [ ] Golden tests WHO wajib memakai dataset rujukan yang disetujui tenaga kesehatan.

## Phase 4 — Operational Workflow
- [ ] Verifikasi hanya dapat dilakukan oleh petugas berwenang dan pada tenant yang sama.
- [ ] Penolakan/koreksi wajib menyimpan alasan.
- [ ] Koreksi membuat versi baru; nilai lama tetap dapat ditelusuri.
- [ ] Audit log tenant-scoped dan immutable dari client.
- [ ] Dashboard dan rekap memakai data aktual; ekspor dicatat.
- [ ] Uji transisi status, koreksi, audit trail, dan konsistensi agregat.

## Phase 5 — AI & Knowledge Base
- [ ] AI hanya menerima payload minimum dari kunjungan terverifikasi.
- [ ] Gemini tidak diberi nama, kontak, alamat, atau identifier langsung.
- [ ] Knowledge document harus melalui review sebelum status approved.
- [ ] Output AI melewati safety checker; kegagalan memakai fallback.
- [ ] Provider, model, prompt, waktu, sumber, dan safety status dicatat.
- [ ] RAG tidak boleh mengikuti instruksi yang tertanam di dokumen.
- [ ] Uji diagnosis, dosis, prompt injection, retrieval kosong, timeout, dan API error.

## Phase 6 — Quality Assurance
- [ ] `npm run typecheck` lulus.
- [ ] `npm test` lulus.
- [ ] `npm run build` lulus pada konfigurasi deployment.
- [ ] Security Rules diuji dengan Firebase Emulator sebelum produksi.
- [ ] Backup terenkripsi dan prosedur restore diuji.
- [ ] Uji performa pada dataset pilot dan jaringan yang disepakati.
- [ ] Uji usability mobile bersama kader dan tenaga kesehatan.
- [ ] Data demo/pengujian hanya sintetis.
- [ ] Release tidak memakai kredensial demo, default key, atau data dummy klinis.

## Batasan yang wajib dipertahankan
1. Jangan menyatakan WHO engine tervalidasi sebelum dataset resmi dan golden tests tersedia.
2. Jangan mengaktifkan jadwal imunisasi produksi sebelum katalog, sumber, versi, tanggal berlaku, dan reviewer disahkan.
3. Jangan mengirim data anak nyata ke provider AI sebelum dasar pemrosesan, persetujuan, dan kebijakan retensi dinilai.
4. Jangan mengaktifkan ekspor detail untuk role yang hanya berhak melihat agregat.
