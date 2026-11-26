# Posify — Frontend (Buku Posyandu Digital)

Frontend prototype untuk lomba web development. Dibangun dari `PRD-Digital-Posyandu` (SDG 3, Smart Lifestyle & Digital Wellbeing).
Stack: **Vite + React 18 + React Router 6 + Framer Motion**, CSS biasa (tanpa Tailwind).

## Menjalankan
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di /dist
```
Deploy ke Vercel/Netlify: `vercel.json` dan `public/_redirects` sudah menangani SPA fallback.

> Font (Baloo 2 + Plus Jakarta Sans) dimuat dari Google Fonts. Untuk demo offline, pasang
> `@fontsource/baloo-2` dan `@fontsource/plus-jakarta-sans`, lalu import di `main.jsx`.

## Identitas visual
| Token | Hex | Pemakaian |
|---|---|---|
| `--pink` | `#ED1566` | Aksi utama, grafik, aksen |
| `--deep` | `#9E1348` | Judul, status "Terverifikasi", hover |
| `--soft` | `#F46095` | Garis dekoratif, gradien |
| `--blush` | `#FCE4EC` | Latar kartu/chip |
| `--white` | `#FFFFFF` | Permukaan |

Semua ada di `:root` pada `src/index.css`. Font heading **Baloo 2** (bulat, hangat, ramah anak) + body **Plus Jakarta Sans** (jelas dibaca, karya desainer Indonesia).

### Mengganti logo
Letakkan logo di `public/logo.svg`, lalu di `src/components/ui.jsx` ubah `const LOGO_SRC = '/logo.svg'`.
Logo sementara (hati dalam kotak) otomatis hilang. Jangan lupa ganti `public/favicon.svg`.

## Animasi & transisi
- **Transisi halaman (tirai dari bawah)** — `src/context/Transition.jsx`. Dua lapis layar naik dari bawah, rute berganti saat layar menutup, lalu terus naik ke atas. Pakai `<TLink to="...">`. Tambahkan prop `soft` untuk perpindahan tab di dalam aplikasi (fade-slide ringan) supaya tidak terasa berat.
- **Landing**: headline muncul per kata, parallax mouse pada ponsel & chip, ribbon berjalan, section *"Buku kertas → Posify"* yang dikendalikan scroll (`useScroll`), grafik yang tergambar sendiri, bento fitur dengan visual mini.
- **Aplikasi**: counter angka, grafik interaktif (ketuk titik), ring progres, typewriter ringkasan, stepper kunjungan, bottom-sheet, kartu verifikasi yang "terbang" saat disahkan, confetti pada sukses simpan.
- Menghormati `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` + CSS).

## Struktur
```
src/
  context/   Transition.jsx (tirai + TLink) · Auth.jsx (peran demo + Guard)
  components/ ui.jsx (ikon, logo, counter, badge, dll) · GrowthChart.jsx · Shell.jsx · Toast.jsx
  pages/     Landing · Login · Parent (5 halaman) · Cadre (6 halaman) · NotFound
  data/      mock.js  ← SELURUH data sintetis; ganti dengan pemanggilan API
```

## Rute
| Peran | Rute |
|---|---|
| Publik | `/` · `/masuk` |
| Orang Tua | `/ortu` · `/ortu/pertumbuhan` · `/ortu/imunisasi` · `/ortu/ringkasan` · `/ortu/koreksi` |
| Kader / Bidan | `/kader` · `/kader/anak` · `/kader/kunjungan` · `/kader/verifikasi` · `/kader/rekap` · `/kader/buku` |

Login demo tanpa kata sandi (peran disimpan di `sessionStorage`). **Hanya Bidan** yang dapat menekan *Sahkan* (sesuai PRD US-T01).

## Kesesuaian dengan PRD
- Data sintetis saja; tidak ada identitas anak nyata.
- Tidak ada label diagnosis. Pengukuran janggal hanya diberi **penanda "perlu diperiksa ulang"**, nilai tidak diubah otomatis.
- Status selalu **ikon + teks** (bukan warna saja). "Belum tercatat" dibedakan dari "belum diberikan".
- Grafik: pita rujukan diberi label **"ilustrasi, bukan standar WHO"**. Perhitungan z-score/klasifikasi asli wajib dari modul backend tervalidasi.
- Jadwal imunisasi diberi banner **"contoh demo"** (belum katalog yang disahkan).
- Ringkasan menampilkan waktu pembentukan, sumber edukasi, dan disclaimer.
- Koreksi: catatan resmi tidak berubah sebelum ditinjau.

## Cakupan terhadap PRD
Sudah (UI): FR-03/04/05/06/07, FR-09/10 (contoh), FR-12, FR-13, FR-14 (sebagian), FR-16 (UI ringkasan), FR-17 (permintaan koreksi), FR-18 (tombol ekspor contoh).
Belum (butuh backend/tim lain): auth nyata + RBAC server, penyimpanan, audit trail nyata, kalkulasi z-score WHO, katalog imunisasi berversi, pembuatan ringkasan AI + safety checker, pengingat, chatbot RAG (opsional), panduan kader, peran reviewer.

## Titik integrasi backend
Ganti impor dari `data/mock.js` dengan pemanggilan API pada: `Parent.jsx` (series, vaccines, summary, tickets), `Cadre.jsx` (kids, queue, recap, books), dan `Auth.jsx` (login nyata).

## Saran alur demo (±3 menit)
Landing (scroll morph) → Masuk **Kader** → Kunjungan baru (isi ukur, kirim) → Masuk **Bidan** → Verifikasi (sahkan) → Masuk **Orang Tua** → Grafik → Ringkasan → Ajukan koreksi.
