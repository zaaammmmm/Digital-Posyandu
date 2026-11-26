# Tahap 4 — Penguatan AI: Validasi Output, Semantic Retrieval, Chatbot RAG, Keamanan Prompt

Tahap ini **mengembangkan** fondasi yang sudah ada (Gemini, `safety-guard`, knowledge base `approved`, persetujuan reviewer,
provenance, payload tanpa identifier langsung). Tidak ada sistem AI terpisah.

## Peta modul (`src/lib/ai/`)
| Modul | Peran |
|---|---|
| `text-utils.ts` | Normalisasi (NFKC, zero-width), tokenisasi, stemmer ringan bahasa Indonesia |
| `pii.ts` | Deteksi/redaksi identifier langsung dan rahasia (kunci API, JWT, kunci hex 64) |
| `prompt-injection.ts` | Deteksi injeksi (pertanyaan & dokumen), netralisasi teks tak tepercaya, deteksi kebocoran prompt (canary + shingle) |
| `retrieval.ts` | Chunking, cosine, ranking hybrid, keputusan kecukupan bukti (abstain) — murni, tanpa I/O |
| `embedding.ts` | Embedding Gemini via REST (kunci di header), vektor dinormalisasi L2 |
| `knowledge-base.ts` | Firestore: memuat dokumen `approved`, indexing embedding, `retrieveRanked`; `retrieveApprovedKnowledge` tetap kompatibel |
| `output-validator.ts` | Validasi JSON ketat, sitasi, grounding kalimat/angka, keamanan klinis; grounding ringkasan kunjungan |
| `rag-pipeline.ts` | Orkestrasi chatbot (dependency-injected → dapat diuji offline) |
| `rag-chat.ts` | Penyambung Gemini + Firestore |

## 1. Validasi output AI
- **Chatbot**: output wajib JSON `{status, answer, citations}` (field lain ditolak). Setiap kalimat berisi fakta harus punya penanda `[S#]`;
  penanda harus ada di sumber yang diambil; daftar `citations` harus sama dengan penanda yang dipakai; tiap kalimat bersitasi harus
  didukung ≥ 50% istilah isinya oleh sumber yang dikutip; angka harus ada di sumber; URL hanya boleh URL sumber; tanpa markup/identifier/rahasia/dosis/diagnosis individual.
- **Ringkasan kunjungan** (`validateSummaryGrounding`, dipanggil di samping `checkAiSummarySafety`): angka/tanggal harus berasal dari payload,
  "tidak tercatat" ≠ "tidak dilakukan", tidak ada penilaian normal/abnormal tanpa asesmen tervalidasi, tanpa URL/markup/JSON, edukasi wajib menyebut `source_title`
  sumber yang disetujui. `PROMPT_VERSION` naik ke `visit-summary-id-v1.2`.
- Gagal → output model **tidak pernah ditampilkan**: ringkasan memakai template deterministik; chatbot menampilkan daftar materi terkait saja.

## 2. Semantic retrieval
- Hanya dokumen `status == approved` dengan penerbit, versi, dan `reviewedAt` valid, dan **lolos pemindaian injeksi**.
- Embedding per chunk di koleksi server-only `knowledge_embeddings` (`{documentId}_{chunkIndex}`) dengan `contentHash` (id+versi+teks), `docVersion`, `embeddingModel`.
  Embedding yang basi (hash/versi/model berbeda) **diabaikan**; chunk itu kembali ke leksikal.
- Skor hybrid = 0,6 × semantik (cosine dipetakan 0,45–0,85 → 0–1) + 0,4 × cakupan leksikal berbobot IDF. Tanpa embedding: mode lexical-only dengan penalti 0,8 dan ambang lebih ketat.
- Embedding dibuat saat persetujuan (best-effort) dan lewat `POST /api/knowledge/reindex` (reviewer/system_admin).

## 3. Chatbot RAG
`POST /api/ai/chat` (parent, cadre, health_worker; 12 pertanyaan/10 menit) dan halaman `/chat`.
Urutan keputusan: pertanyaan valid → **tanda bahaya darurat** (rujukan IGD/112, tanpa model) → **injeksi** (ditolak) → **permintaan klinis individual**
(diagnosis/obat/dosis, dirujuk ke petugas) → retrieval → **abstain** bila bukti tidak memadai (tanpa memanggil model) → generasi → validasi → fallback.
Sitasi (judul, penerbit, **versi**, **tanggal tinjau**, URL) dibangun server dari metadata dokumen, bukan dari model. Tanpa riwayat percakapan (stateless) untuk memperkecil permukaan serangan.
Pertanyaan tidak berisi data anak; identifier langsung diredaksi/dibuang sebelum retrieval dan model. Teks pertanyaan **tidak disimpan**: koleksi `ai_chat_events` hanya
menyimpan hash, status, kode alasan, id sumber, model, versi prompt.

## 4. Prompt injection & kebocoran
- Lapisan: (1) deteksi pola ID/EN dengan normalisasi (full-width, zero-width, leet, huruf terpisah); (2) dokumen ditolak saat dibuat dan saat disetujui (422) serta dikarantina saat retrieval;
  (3) instruksi tepercaya hanya di `systemInstruction`, teks tak tepercaya dibungkus pagar ber-nonce acak per permintaan dan dinetralkan; (4) skema JSON ketat; (5) validasi sitasi/grounding;
  (6) cek kebocoran: canary per permintaan + potongan 7 kata dari instruksi sistem + pola rahasia/identifier.
- Pengujian: `tests/prompt-injection.test.ts`, `tests/ai-output-validator.test.ts`, `tests/semantic-retrieval.test.ts`, `tests/rag-golden.test.ts`, `tests/rag-wiring.test.ts`.

## Konfigurasi baru
`GEMINI_EMBEDDING_MODEL` (default `gemini-embedding-001`), `GEMINI_EMBEDDING_DIMENSIONS` (default `768`). `GEMINI_MODEL` dipakai juga oleh chatbot.

## Batasan dan pekerjaan sebelum produksi
1. **Ambang retrieval** (`RETRIEVAL_CONFIG`) adalah nilai awal. Kalibrasi dengan set evaluasi yang ditinjau tenaga kesehatan; golden test saat ini memakai korpus fiksi kecil.
2. Panggilan Gemini (generasi & embedding) **belum diuji terhadap API langsung** di lingkungan pengembangan ini; bentuk request mengikuti dokumentasi REST publik. Verifikasi di staging.
3. Retrieval memuat semua embedding dokumen approved ke memori (batas 200 dokumen). Untuk korpus besar gunakan indeks vektor.
4. Validator sengaja konservatif: kata seperti "dosis"/"resep" atau angka bersatuan obat di jawaban akan memicu fallback walau ada di sumber.
5. Deteksi injeksi berbasis pola tidak menjamin lolos serangan baru; lapisan lain tetap wajib. Tambahkan kasus baru ke tes saat ditemukan.
6. Aturan Firestore perlu diuji di emulator (belum ada tes emulator di repo).
7. Perlu keputusan kebijakan: apakah chatbot (tanpa data anak) memerlukan pemberitahuan/consent tersendiri. Saat ini tidak memakai `AI_SUMMARY_NOTICE_VERSION`.
