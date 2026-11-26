import { contentTokens, sha256Hex } from "./text-utils.ts";
import { scanKnowledgeDocument, neutralizeUntrustedText } from "./prompt-injection.ts";

/**
 * Pure (no I/O) retrieval logic: chunking, cosine similarity, hybrid semantic+lexical ranking
 * and the evidence-sufficiency decision. Firestore/Gemini wiring lives in knowledge-base.ts.
 *
 * All thresholds below are STARTING VALUES. They must be calibrated against a reviewed
 * evaluation set (see tests/rag-golden.test.ts and docs/STAGE-4-AI-RAG.md) before production use.
 */

export const RETRIEVAL_CONFIG = {
  weightSemantic: 0.6,
  weightLexical: 0.4,
  /** cosine below floor maps to 0; floor+span maps to 1 */
  semanticFloor: 0.45,
  semanticSpan: 0.4,
  minHybrid: 0.4,
  minLexicalWithSemantic: 0.2,
  strongCosine: 0.72,
  minLexicalOnly: 0.5,
  maxChunkChars: 900,
  chunkOverlapChars: 120,
  maxChunksPerDocument: 2,
} as const;

const UNSEEN_TERM_WEIGHT = 0.4;

export type KnowledgeDocument = {
  id: string; title: string; text: string; sourceTitle: string; sourceUrl?: string | null;
  version: string; reviewedAt: string; status: string; keywords?: string[];
};

export type KnowledgeChunk = {
  documentId: string; chunkIndex: number; text: string; contentHash: string;
  title: string; sourceTitle: string; sourceUrl?: string | null; version: string; reviewedAt: string;
};

export type StoredEmbedding = {
  documentId: string; chunkIndex: number; contentHash: string; docVersion: string;
  embeddingModel: string; dimensions: number; vector: number[];
};

export type RankedChunk = KnowledgeChunk & {
  semantic: number | null; cosine: number | null; lexical: number; hybrid: number; matchedTerms: number;
};

/** A document may be used for retrieval only if it is approved and fully attributable. */
export function isEligibleDocument(doc: Partial<KnowledgeDocument> | null | undefined): doc is KnowledgeDocument {
  if (!doc) return false;
  const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  if (doc.status !== "approved") return false;
  if (!nonEmpty(doc.id) || !nonEmpty(doc.title) || !nonEmpty(doc.text) || !nonEmpty(doc.sourceTitle)
      || !nonEmpty(doc.version) || !nonEmpty(doc.reviewedAt)) return false;
  if (Number.isNaN(Date.parse(String(doc.reviewedAt)))) return false;
  // Defence in depth: a document carrying injection patterns is quarantined even if it was approved earlier.
  if (scanKnowledgeDocument(doc).detected) return false;
  return true;
}

/** Split on paragraph/sentence boundaries into overlapping chunks. Deterministic. */
export function chunkDocument(doc: KnowledgeDocument, maxChars = RETRIEVAL_CONFIG.maxChunkChars,
  overlap = RETRIEVAL_CONFIG.chunkOverlapChars): KnowledgeChunk[] {
  const text = neutralizeUntrustedText(doc.text.replace(/\r/g, "").replace(/\n{2,}/g, " \u00B6 "), 30000).replace(/ \u00B6 /g, "\n");
  const units = text.split(/\n|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    if (current && current.length + unit.length + 1 > maxChars) {
      chunks.push(current);
      current = current.slice(Math.max(0, current.length - overlap)).replace(/^\S*\s/, "");
    }
    current = current ? `${current} ${unit}` : unit;
    while (current.length > maxChars * 1.5) { // single very long sentence
      chunks.push(current.slice(0, maxChars));
      current = current.slice(maxChars - overlap);
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks.map((chunk, chunkIndex) => ({
    documentId: doc.id, chunkIndex, text: chunk, contentHash: chunkHash(doc, chunk),
    title: doc.title, sourceTitle: doc.sourceTitle, sourceUrl: doc.sourceUrl ?? null,
    version: doc.version, reviewedAt: doc.reviewedAt,
  }));
}

/** Hash binds an embedding to the exact text AND approved version it was computed from. */
export function chunkHash(doc: Pick<KnowledgeDocument, "id" | "version">, chunkText: string): string {
  return sha256Hex(`${doc.id}\u0000${doc.version}\u0000${chunkText}`);
}

export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]), y = Number(b[i]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function normalizeVector(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v.slice() : v.map(x => x / norm);
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type LexicalIndex = { idf: Map<string, number>; chunkTokens: Set<string>[] };

function buildLexicalIndex(chunks: KnowledgeChunk[]): LexicalIndex {
  const chunkTokens = chunks.map(c => new Set(contentTokens(`${c.title} ${c.text}`)));
  const df = new Map<string, number>();
  for (const set of chunkTokens) for (const t of set) df.set(t, (df.get(t) || 0) + 1);
  const n = chunks.length;
  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log(1 + (n - d + 0.5) / (d + 0.5)));
  return { idf, chunkTokens };
}

/** IDF-weighted coverage of the query's content terms by a chunk, in [0,1]. */
function lexicalCoverage(queryTerms: string[], index: LexicalIndex, i: number): { score: number; matched: number } {
  if (queryTerms.length === 0) return { score: 0, matched: 0 };
  // A term absent from the whole corpus is either filler ("hubungi", "tolong") or an off-topic word; it is
  // down-weighted rather than treated as maximally informative. Off-topic queries still abstain because
  // they match too few in-corpus terms (see minTerms in isEvidenceSufficient).
  const defaultIdf = UNSEEN_TERM_WEIGHT * Math.log(1 + (index.chunkTokens.length + 0.5) / 0.5);
  let total = 0, hit = 0, matched = 0;
  for (const term of queryTerms) {
    const w = index.idf.get(term) ?? defaultIdf;
    total += w;
    if (index.chunkTokens[i].has(term)) { hit += w; matched++; }
  }
  return { score: total === 0 ? 0 : hit / total, matched };
}

export function semanticScoreFromCosine(cosine: number): number {
  return clamp01((cosine - RETRIEVAL_CONFIG.semanticFloor) / RETRIEVAL_CONFIG.semanticSpan);
}

/**
 * Hybrid ranking. `embeddings` are matched to chunks by (documentId, chunkIndex) AND must have
 * the same contentHash/docVersion; stale or mismatched embeddings are ignored (chunk falls back to lexical).
 */
export function rankChunks(input: {
  query: string; queryEmbedding?: number[] | null; chunks: KnowledgeChunk[]; embeddings?: StoredEmbedding[];
  limit?: number;
}): RankedChunk[] {
  const cfg = RETRIEVAL_CONFIG;
  const queryTerms = [...new Set(contentTokens(input.query))];
  if (queryTerms.length === 0 || input.chunks.length === 0) return [];
  const index = buildLexicalIndex(input.chunks);
  const byKey = new Map((input.embeddings || []).map(e => [`${e.documentId}#${e.chunkIndex}`, e]));
  const q = input.queryEmbedding && input.queryEmbedding.length ? input.queryEmbedding : null;

  const ranked: RankedChunk[] = input.chunks.map((chunk, i) => {
    const lex = lexicalCoverage(queryTerms, index, i);
    const emb = byKey.get(`${chunk.documentId}#${chunk.chunkIndex}`);
    const usable = q && emb && emb.contentHash === chunk.contentHash && emb.docVersion === chunk.version
      && emb.vector.length === q.length ? emb : null;
    const cosine = usable ? cosineSimilarity(q!, usable.vector) : null;
    const semantic = cosine === null ? null : semanticScoreFromCosine(cosine);
    const hybrid = semantic === null ? lex.score * 0.8 // lexical-only is penalised: less trustworthy than hybrid
      : cfg.weightSemantic * semantic + cfg.weightLexical * lex.score;
    return { ...chunk, semantic, cosine, lexical: lex.score, hybrid, matchedTerms: lex.matched };
  });

  ranked.sort((a, b) => b.hybrid - a.hybrid || b.lexical - a.lexical);
  const perDoc = new Map<string, number>();
  const out: RankedChunk[] = [];
  for (const r of ranked) {
    if (r.hybrid <= 0) continue;
    const n = perDoc.get(r.documentId) || 0;
    if (n >= cfg.maxChunksPerDocument) continue;
    perDoc.set(r.documentId, n + 1);
    out.push(r);
    if (out.length >= (input.limit ?? 4)) break;
  }
  return out;
}

/** Abstention rule: is the best evidence strong enough to let the LLM answer at all? */
export function isEvidenceSufficient(ranked: RankedChunk[], queryTermCount: number): boolean {
  const top = ranked[0];
  if (!top) return false;
  const cfg = RETRIEVAL_CONFIG;
  if (top.cosine !== null) {
    return top.hybrid >= cfg.minHybrid && (top.lexical >= cfg.minLexicalWithSemantic || top.cosine >= cfg.strongCosine);
  }
  const minTerms = queryTermCount <= 1 ? 1 : 2;
  return top.lexical >= cfg.minLexicalOnly && top.matchedTerms >= minTerms;
}

export function retrievalMode(ranked: RankedChunk[]): "hybrid" | "lexical_only" | "none" {
  if (!ranked.length) return "none";
  return ranked.some(r => r.cosine !== null) ? "hybrid" : "lexical_only";
}
