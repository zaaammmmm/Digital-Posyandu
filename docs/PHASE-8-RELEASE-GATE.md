# Phase 8 — Quality Assurance, Compliance & Deployment

## Gerbang wajib sebelum produksi

### Automated QA
- `npm run typecheck`
- `npm test`
- `npm run build`
- Firebase Emulator Rules tests untuk enam peran, tenant sama/lintas tenant, guardian ownership, dan reviewer.
- Golden tests WHO untuk WAZ, LAZ/HAZ, WLZ/WHZ setelah referensi resmi disahkan.
- AI safety tests: prompt injection, diagnosis/resep, data kosong, sumber tidak approved, dan fallback.
- Regression test untuk koreksi, versioning, duplikasi, dan idempotency.

### Operasional dan privasi
- Backup Firestore terenkripsi dan restore drill berhasil.
- Retensi, penghapusan, ekspor, consent, dan incident response terdokumentasi.
- Log tidak memuat token, private key, payload kesehatan, atau PII berlebihan.
- Akses system_admin terhadap data kesehatan diuji negatif.
- Reviewer hanya mengakses knowledge base dan metadata aturan.
- Uji performa target PRD: dashboard 3 detik dan pencarian 2 detik pada dataset/jaringan uji yang didokumentasikan.

### Pilot
- Uji alur bersama kader dan tenaga kesehatan.
- Validasi formulir, satuan, metode pengukuran, koreksi, dan alur rujukan.
- Uji perangkat mobile dan kondisi jaringan lapangan.
- Persetujuan tertulis pemilik proses sebelum aktivasi data nyata.

## Preflight

Jalankan `npm run preflight:production` dengan environment produksi. Script hanya memeriksa konfigurasi dasar; ia tidak membuktikan kepatuhan, keamanan, validitas klinis, atau kesiapan operasional.
