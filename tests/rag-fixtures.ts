import { chunkDocument, type KnowledgeDocument, type KnowledgeChunk, type RankedChunk, rankChunks } from "../src/lib/ai/retrieval.ts";

const reviewedAt = "2026-01-15T00:00:00.000Z";
const mk = (id: string, title: string, text: string, sourceTitle = "Buku KIA Kemenkes"): KnowledgeDocument =>
  ({ id, title, text, sourceTitle, sourceUrl: "https://example.org/kia", version: "2024.1", reviewedAt, status: "approved" });

export const DOCS: KnowledgeDocument[] = [
  mk("mpasi", "Pemberian makan bayi usia 6 bulan",
    "Mulai usia 6 bulan, bayi diberikan makanan pendamping ASI (MPASI) secara bertahap. Berikan makanan beragam yang mengandung protein hewani. ASI tetap diteruskan sampai anak berusia 2 tahun."),
  mk("timbang", "Penimbangan balita di Posyandu",
    "Balita ditimbang setiap bulan di Posyandu untuk memantau pertumbuhan. Hasil penimbangan dicatat di buku KIA. Penimbangan rutin membantu petugas melihat perubahan berat badan anak."),
  mk("asi", "ASI eksklusif",
    "ASI eksklusif diberikan sejak lahir sampai bayi berusia 6 bulan tanpa makanan atau minuman lain. Menyusui sesering mungkin membantu produksi ASI."),
  mk("cuci", "Cuci tangan pakai sabun",
    "Cuci tangan pakai sabun dengan air mengalir sebelum menyiapkan makanan dan sebelum memberi makan anak. Cuci tangan juga dilakukan setelah buang air besar."),
];

export const CHUNKS: KnowledgeChunk[] = DOCS.flatMap(d => chunkDocument(d));

export function retrieveOffline(query: string): Promise<{ ranked: RankedChunk[]; queryTermCount: number }> {
  return Promise.resolve({ ranked: rankChunks({ query, chunks: CHUNKS, limit: 4 }),
    queryTermCount: new Set(query.toLowerCase().split(/\W+/).filter(w => w.length > 2)).size });
}
