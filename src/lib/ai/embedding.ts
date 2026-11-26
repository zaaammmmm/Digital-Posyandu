import { normalizeVector } from "./retrieval.ts";

/** Gemini embeddings over REST. The API key is sent in a header, never in the URL. */
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS) > 0
  ? Number(process.env.GEMINI_EMBEDDING_DIMENSIONS) : 768;

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";
const MAX_BATCH = 100;

export function embeddingsConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Returns one L2-normalised vector per input, or throws. Callers must handle failure by degrading to lexical retrieval. */
export async function embedTexts(texts: string[], taskType: TaskType, timeoutMs = 10000): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi");
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`,
        { method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({ requests: batch.map(text => ({
            model: `models/${EMBEDDING_MODEL}`, content: { parts: [{ text }] },
            taskType, outputDimensionality: EMBEDDING_DIMENSIONS,
          })) }) });
      if (!response.ok) throw new Error(`Gemini embedding HTTP ${response.status}`);
      const data = await response.json() as { embeddings?: Array<{ values?: number[] }> };
      const vectors = data.embeddings || [];
      if (vectors.length !== batch.length) throw new Error("Jumlah embedding tidak sesuai");
      for (const v of vectors) {
        if (!Array.isArray(v.values) || v.values.length !== EMBEDDING_DIMENSIONS || !v.values.every(Number.isFinite)) {
          throw new Error("Embedding tidak valid");
        }
        out.push(normalizeVector(v.values));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return out;
}
