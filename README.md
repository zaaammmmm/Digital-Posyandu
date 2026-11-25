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
