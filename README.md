# Digital Posyandu

Aplikasi berbasis Next.js untuk mendukung operasional Posyandu: pengelolaan anak dan wali, kunjungan pertumbuhan, verifikasi kesehatan, imunisasi/suplemen, laporan, audit, serta ringkasan berbantuan AI.

> Catatan klinis: engine pertumbuhan belum dinyatakan tervalidasi sampai dataset rujukan resmi dan golden tests disediakan serta disetujui tenaga kesehatan. Jadwal imunisasi produksi juga tidak boleh diaktifkan sebelum katalog, sumber, versi, masa berlaku, dan reviewer disahkan.

## Fitur

- Autentikasi Firebase dan sesi berbasis cookie HTTP-only
- Pembatasan akses berdasarkan role dan keanggotaan Posyandu
- Dashboard terpisah untuk administrator, kader, tenaga kesehatan, orang tua, dan reviewer
- Pendaftaran anak, wali, kunjungan, dan data administrasi
- Pengukuran antropometri serta visualisasi pertumbuhan
- Alur verifikasi kunjungan, koreksi, dan audit log
- Catatan imunisasi, suplemen, dan rekap laporan
- Ringkasan kunjungan berbasis Gemini dengan payload minimum dan safety check
- Tampilan responsif dengan sidebar desktop dan navigasi mobile
- Penyimpanan draft kunjungan untuk mendukung penggunaan offline

## Peran

| Peran | Cakupan utama |
|---|---|
| `system_admin` | Administrasi lintas sistem dan pengelolaan tenant |
| `posyandu_admin` | Administrasi Posyandu, anggota, laporan, dan audit |
| `cadre` | Pendaftaran anak, kunjungan, dan administrasi |
| `health_worker` | Verifikasi kunjungan dan peninjauan kesehatan |
| `parent` | Melihat data anak dan kunjungan yang terkait |
| `reviewer` | Peninjauan konten atau data sesuai otorisasi |

## Teknologi

- Next.js 15 dengan App Router
- React 19
- TypeScript
- Firebase Authentication, Firebase Admin, dan Cloud Firestore
- Recharts untuk grafik pertumbuhan
- Tailwind CSS
- Lucide React

## Prasyarat

- Node.js 20 atau lebih baru direkomendasikan
- npm
- Proyek Firebase dengan Authentication dan Firestore aktif
- Kredensial service account hanya untuk server (jika memakai Firebase Admin)
- API key Google Gemini hanya untuk fitur ringkasan AI

## Instalasi

```bash
npm install
```

Salin variabel lingkungan ke `.env.local`:

```dotenv
# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Enkripsi field
FIELD_ENCRYPTION_KEY=

# Gemini AI
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

`FIELD_ENCRYPTION_KEY` harus berupa kunci rahasia stabil yang disediakan oleh deployment dan tidak boleh berisi nilai demo. Kunci yang berubah dapat membuat data terenkripsi lama tidak dapat dibaca.

### Jalankan aplikasi

```bash
npm run dev
```

Buka <http://localhost:3000>.

## Perintah

```bash
npm run dev       # Jalankan server pengembangan
npm run typecheck # Periksa tipe TypeScript
npm test          # Jalankan pengujian Node
npm run build     # Bangun aplikasi untuk produksi
npm start         # Jalankan hasil build produksi
npm run check     # typecheck, test, lalu build
```

## Struktur proyek

```text
src/
├── app/                 # Route, halaman dashboard, dan API routes
├── components/          # Komponen UI, form, layout, dan chart
├── lib/
│   ├── ai/              # Payload AI, knowledge base, safety, dan generator
│   ├── audit/           # Audit logger
│   ├── auth/            # Sesi dan otorisasi server
│   ├── crypto/          # Enkripsi field
│   ├── firebase/        # Firebase client dan admin
│   ├── growth/          # Umur, validasi, dan growth engine
│   ├── offline/         # Penyimpanan draft
│   └── schedule/        # Aturan jadwal administrasi
└── types/               # Tipe domain dan verifikasi
tests/                   # Pengujian pertumbuhan, AI safety, crypto, dan UI
```

## Konfigurasi Firebase

1. Buat proyek Firebase.
2. Aktifkan Email/Password pada Firebase Authentication.
3. Buat Firestore database.
4. Terapkan aturan dari `firestore.rules`:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

5. Buat data membership aktif sesuai format yang digunakan oleh aturan:

```text
memberships/{uid}_{posyanduId}
```

Contoh isi dokumen:

```json
{
  "userId": "uid-pengguna",
  "posyanduId": "posyandu-demo",
  "role": "cadre",
  "status": "active"
}
```

Gunakan hanya data sintetis saat pengujian. Jangan menempatkan private key atau kunci enkripsi pada kode sumber maupun variabel `NEXT_PUBLIC_*`.

## Bootstrap Firebase dan seeder

Seeder bootstrap hanya membuat tenant, akun awal opsional, membership, dan metadata bootstrap. Seeder ini **tidak** membuat anak, wali, consent, kunjungan, antropometri, hasil pertumbuhan, imunisasi, atau suplemen sintetis. Collection klinis akan terbentuk ketika workflow aplikasi yang tervalidasi menyimpan dokumen pertama.

Atur variabel berikut pada `.env.local` (atau environment shell):

```dotenv
FIREBASE_ADMIN_PROJECT_ID=project-id-anda
# Gunakan service account melalui FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY,
# atau GOOGLE_APPLICATION_CREDENTIALS yang menunjuk file service account di server.
SEED_POSYANDU_ID=posyandu-kode-internal
SEED_POSYANDU_NAME=Nama Posyandu
SEED_POSYANDU_VILLAGE=Desa
SEED_POSYANDU_DISTRICT=Kecamatan
SEED_POSYANDU_REGENCY=Kabupaten
SEED_POSYANDU_PROVINCE=Provinsi
SEED_ADMIN_EMAIL=admin@example.org
SEED_ADMIN_PASSWORD=GANTI_DENGAN_PASSWORD_MINIMAL_12_KARAKTER
SEED_ADMIN_NAME=Administrator Posyandu
# Opsional: akun reviewer konten
SEED_REVIEWER_EMAIL=reviewer@example.org
SEED_REVIEWER_PASSWORD=GANTI_DENGAN_PASSWORD_MINIMAL_12_KARAKTER
SEED_REVIEWER_NAME=Reviewer Konten
```

Jalankan dari root proyek:

```bash
npm run seed:firestore                 # dry-run, tidak menulis data
npm run seed:firestore -- --apply      # menerapkan seed secara idempotent
```

Akun Firebase Authentication yang sudah ada akan digunakan kembali; password akun yang sudah ada tidak diubah. Membership yang sudah ada tidak ditimpa. Seeder tidak pernah mengaktifkan ulang membership nonaktif atau mengubah role yang sudah berbeda. Simpan kredensial hanya pada secret manager/server, jangan commit `.env.local`.

### Referensi klinis dan materi edukasi

Jadwal imunisasi dapat diimpor melalui `SEED_IMMUNIZATION_RULES_FILE=path/ke-rules.json`; setiap item wajib memiliki `id`, `vaccineCode`, `ruleDescription`, `effectiveFrom`, `officialSource`, dan `sourceDocumentVersion`. Seeder selalu menyimpan status `draft`, `reviewedBy: null`, dan `approvedAt: null`. Jadwal tidak dapat dipakai sebagai jadwal produksi sebelum ditinjau dan disetujui tenaga berwenang.

Materi knowledge base dapat diimpor melalui `SEED_KNOWLEDGE_DOCUMENTS_FILE=path/ke-documents.json`; setiap item wajib memiliki `id`, `title`, `text`, `sourceTitle`, dan `version`. Status selalu `pending_review`, bukan `approved`. Gunakan dokumen resmi dan metadata sumber yang dapat diverifikasi.

### Data demo untuk uji tampilan per peran (opsional, hanya dev/staging)

Seeder bootstrap di atas sengaja tidak membuat data pasien. Untuk melihat layar yang terisi saat login sebagai berbagai peran, gunakan seeder **terpisah** `seed:demo`. Seeder ini mengisi seluruh collection non-identitas dengan data **sintetis** (anak `DEMO-001` s.d. `DEMO-008`, kunjungan, antropometri, imunisasi, vitamin, skrining, consent, ringkasan, koreksi, administrasi, audit, materi edukasi, knowledge base, dan aturan imunisasi demo).

```bash
npm run seed:demo                       # dry run: menampilkan rencana & siapa melihat apa
npm run seed:demo -- --apply            # menulis / menyinkronkan data demo
npm run seed:demo -- --clean --apply    # menghapus seluruh data demo
```

- **Tidak membuat/mengubah** akun Auth, `users`, maupun `memberships`. Seeder hanya *membaca* membership aktif untuk menautkan data ke akun yang sudah ada (anak ditautkan ke akun `parent` melalui `guardianUids`; pencatat/verifikator memakai akun `cadre`/`health_worker`). Tenant diambil dari `SEED_POSYANDU_ID` atau `--posyandu=<id>`; otomatis dipilih bila hanya ada satu tenant.
- Semua dokumen berid `demo-*` dan bertanda `seededBy: "digital-posyandu-demo-seed"`. Seeder hanya menimpa/menghapus dokumen bertanda itu dan berhenti bila sebuah ID sudah dipakai dokumen lain. Menjalankannya ulang aman (tanggal bersifat relatif terhadap hari ini).
- Skenario yang tersedia: antrean verifikasi dan penanda kualitas, kunjungan dikembalikan (tindak lanjut kader), koreksi berversi (selesai dan menunggu verifikasi ulang), permintaan koreksi pada tiap status, imunisasi/vitamin `verified`/`pending_verification`/`rejected`, consent `granted`/`withdrawn`/`declined`, anak `active`/`archived`/`needs_verification`, serta audit trail yang selaras.
- **Z-score tidak pernah dibuat.** `growth_assessments` mengikuti engine yang fail-closed (`zScore: null`). Nilai berat/tinggi adalah angka ilustratif, bukan acuan WHO.
- Aturan imunisasi dan knowledge base demo diberi label `[DEMO]`, sumber "DATA DEMO — bukan jadwal resmi", dan **berstatus approved** agar jadwal serta panduan kader tampil. Gunakan `--draft-reference-only` bila ingin tetap `draft`/`pending_review`.
- Seeder menolak berjalan saat `NODE_ENV=production` (kecuali `--allow-production`). **Jangan jalankan pada tenant yang berisi data anak nyata.**

### Rules, indexes, dan emulator

`firebase.json` mengikat `firestore.rules` dan `firestore.indexes.json`. Deploy konfigurasi dengan:

```bash
npm run firebase:deploy
```

Uji Rules terlebih dahulu menggunakan Firebase Emulator:

```bash
npm run emulators
```

Rules menolak seluruh direct client writes pada data operasional/klinis; mutasi harus melalui API server yang memverifikasi ID token, membership, tenant, role, dan audit. Catatan: Admin SDK melewati Firestore Rules, sehingga pemeriksaan otorisasi pada setiap API route tetap wajib. Indexes mengikuti query yang ditemukan pada repository dan dapat meminta index tambahan jika query baru ditambahkan.

Detail mapping entitas PRD ke collection, field minimum, dan batasan seed tersedia pada [`docs/FIRESTORE-COLLECTION-CATALOG.md`](docs/FIRESTORE-COLLECTION-CATALOG.md).

## Keamanan dan privasi

- API server memverifikasi identitas dan membatasi akses berdasarkan tenant serta role.
- Client tidak boleh mengatur identitas, Posyandu, atau role sebagai otoritas mutlak.
- Firestore Rules menolak akses lintas tenant dan menonaktifkan penulisan langsung untuk banyak collection sensitif.
- Gunakan enkripsi field untuk data kontak dan rahasia sesuai implementasi aplikasi.
- Data anak nyata tidak boleh dikirim ke provider AI sebelum dasar pemrosesan, persetujuan, kebijakan retensi, dan penilaian privasi selesai.
- Payload AI harus tetap minimum dan tidak mengandung nama, kontak, alamat, atau identifier langsung.
- Audit log bersifat tenant-scoped dan tidak dapat ditulis langsung oleh client.
- Jalankan uji aturan Firebase Emulator sebelum deployment produksi.

## Pengujian

Pengujian saat ini mencakup:

- Keamanan AI dan perlindungan terhadap prompt berbahaya
- Enkripsi field
- Growth engine
- Persyaratan UI refresh

Jalankan seluruh pemeriksaan:

```bash
npm run check
```

Untuk review manual UI, periksa halaman pada lebar 360 px, 768 px, dan desktop. Pastikan navigasi, tombol, form, tabel horizontal, chart, loading/error state, serta preferensi `prefers-reduced-motion` tetap berfungsi.

## Deployment

Set semua variabel lingkungan pada platform hosting. Pastikan:

- Firebase Admin menggunakan service account atau credential deployment yang aman
- `NEXT_PUBLIC_APP_URL` sesuai domain produksi
- `FIELD_ENCRYPTION_KEY` tersedia dan disimpan di secrets manager
- Firestore Rules dan Indexes sudah diterapkan
- Kredensial demo tidak digunakan
- Data klinis dummy tidak tersedia di lingkungan produksi
- Backup terenkripsi dan prosedur restore sudah diuji

## Dokumen terkait

- `docs/IMPLEMENTATION-ACCEPTANCE.md` — checklist penerapan, keamanan, dan rilis
- `docs/UI-REFRESH-ACCEPTANCE.md` — kriteria penerimaan UI dan verifikasi manual
- `firestore.rules` — aturan akses Firestore
- `firestore.indexes.json` — indeks Firestore
- `Digital-Posyandu-PATCH-MANIFEST.json` — manifest patch

## Lisensi

Lihat file `LICENSE` untuk informasi lisensi.
