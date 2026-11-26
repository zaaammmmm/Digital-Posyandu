# Phase 7 — Offline, Notification & PWA

## Penyimpanan draft

Draft browser disimpan di IndexedDB dalam bentuk AES-GCM. Kunci acak hanya berada di `sessionStorage`; akibatnya draft tidak dapat dipulihkan setelah sesi browser berakhir. Ini adalah kompromi fail-closed untuk mencegah draft kesehatan terenkripsi permanen tanpa mekanisme manajemen kunci perangkat.

Jangan menganggap penyimpanan ini sebagai sinkronisasi offline penuh. Draft harus ditampilkan sebagai belum tersinkron dan tidak boleh membuat kunjungan terverifikasi secara otomatis.

## Sinkronisasi yang masih harus diselesaikan

- Endpoint sinkronisasi idempotent dengan idempotency key.
- Validasi ulang tenant, membership, kepemilikan anak, dan versi record di server.
- Konflik versi harus masuk antrean resolusi manusia; jangan overwrite.
- Retry eksponensial dengan batas percobaan dan status gagal yang terlihat.
- Hapus draft lokal hanya setelah server mengonfirmasi commit.
- Persetujuan kanal notifikasi harus direkam sebelum mengirim pesan.

Offline-first penuh tidak termasuk asumsi MVP PRD dan harus diuji pada pilot sebelum diaktifkan.
