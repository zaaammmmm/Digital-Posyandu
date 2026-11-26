import { adminDb } from "@/lib/firebase/admin";
import { chunkDocument, isEligibleDocument, isEvidenceSufficient, rankChunks, type KnowledgeChunk, type KnowledgeDocument,
  type RankedChunk, type StoredEmbedding } from "./retrieval";
import { contentTokens } from "./text-utils";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, embedTexts, embeddingsConfigured } from "./embedding";

export type ApprovedSnippet = {
  id: string; title: string; text: string; sourceTitle: string;
  sourceUrl?: string; version: string; reviewedAt: string;
};

const EMBEDDINGS = "knowledge_embeddings";
const MAX_DOCS = 200;

function toDocument(id: string, d: FirebaseFirestore.DocumentData): Partial<KnowledgeDocument> {
  return { id, title: d.title, text: d.text, sourceTitle: d.sourceTitle, sourceUrl: d.sourceUrl ?? null,
    version: d.version, reviewedAt: d.reviewedAt, status: d.status, keywords: Array.isArray(d.keywords) ? d.keywords : [] };
}

/** Approved, attributable, injection-free documents only. Everything else is invisible to retrieval. */
async function loadEligibleDocuments(): Promise<KnowledgeDocument[]> {
  const snap = await adminDb.collection("knowledge_documents").where("status", "==", "approved").limit(MAX_DOCS).get();
  return snap.docs.map(doc => toDocument(doc.id, doc.data())).filter(isEligibleDocument);
}

/** (Re)build embeddings for one approved document. Old chunk vectors are replaced atomically. */
export async function indexKnowledgeDocument(documentId: string): Promise<{ chunks: number; embedded: boolean }> {
  const snap = await adminDb.collection("knowledge_documents").doc(documentId).get();
  const doc = snap.exists ? toDocument(snap.id, snap.data()!) : null;
  if (!isEligibleDocument(doc)) throw new Error("Dokumen tidak memenuhi syarat untuk diindeks");
  const chunks = chunkDocument(doc);
  const old = await adminDb.collection(EMBEDDINGS).where("documentId", "==", documentId).get();
  if (!embeddingsConfigured()) return { chunks: chunks.length, embedded: false };
  const vectors = await embedTexts(chunks.map(c => `${c.title}\n${c.text}`), "RETRIEVAL_DOCUMENT");
  const batch = adminDb.batch();
  old.docs.forEach(d => batch.delete(d.ref));
  chunks.forEach((chunk, i) => batch.set(adminDb.collection(EMBEDDINGS).doc(`${documentId}_${chunk.chunkIndex}`), {
    documentId, chunkIndex: chunk.chunkIndex, contentHash: chunk.contentHash, docVersion: doc.version,
    embeddingModel: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS, vector: vectors[i], createdAt: new Date().toISOString(),
  }));
  await batch.commit();
  return { chunks: chunks.length, embedded: true };
}

export async function retrieveRanked(query: string, limit = 4): Promise<{ ranked: RankedChunk[]; queryTermCount: number }> {
  const queryTermCount = new Set(contentTokens(query)).size;
  if (queryTermCount === 0) return { ranked: [], queryTermCount };
  const docs = await loadEligibleDocuments();
  const chunks: KnowledgeChunk[] = docs.flatMap(d => chunkDocument(d));
  if (!chunks.length) return { ranked: [], queryTermCount };

  let queryEmbedding: number[] | null = null;
  let embeddings: StoredEmbedding[] = [];
  if (embeddingsConfigured()) {
    try {
      const [vec, snap] = await Promise.all([
        embedTexts([query], "RETRIEVAL_QUERY", 6000),
        adminDb.collection(EMBEDDINGS).limit(MAX_DOCS * 40).get(),
      ]);
      queryEmbedding = vec[0];
      const approvedIds = new Set(docs.map(d => d.id));
      embeddings = snap.docs.map(d => d.data() as StoredEmbedding)
        .filter(e => approvedIds.has(e.documentId) && e.embeddingModel === EMBEDDING_MODEL && Array.isArray(e.vector));
    } catch {
      queryEmbedding = null; // degrade to lexical-only; the abstention threshold becomes stricter automatically
    }
  }
  return { ranked: rankChunks({ query, queryEmbedding, chunks, embeddings, limit }), queryTermCount };
}

/** Backwards-compatible helper used by the visit-summary payload builder. */
export async function retrieveApprovedKnowledge(query: string, limit = 4): Promise<ApprovedSnippet[]> {
  const { ranked, queryTermCount } = await retrieveRanked(query, limit);
  if (!isEvidenceSufficient(ranked, queryTermCount)) return [];
  const seen = new Set<string>();
  const out: ApprovedSnippet[] = [];
  for (const r of ranked) {
    if (seen.has(r.documentId)) continue;
    seen.add(r.documentId);
    out.push({ id: r.documentId, title: r.title, text: r.text, sourceTitle: r.sourceTitle,
      sourceUrl: r.sourceUrl ?? undefined, version: r.version, reviewedAt: r.reviewedAt });
  }
  return out;
}
