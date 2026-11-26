import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { indexKnowledgeDocument } from "@/lib/ai/knowledge-base";
import { EMBEDDING_MODEL, embeddingsConfigured } from "@/lib/ai/embedding";

/** Rebuild embeddings for all approved documents (e.g. after changing the embedding model). */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["content_reviewer", "system_admin"]);
  if (isAuthError(auth)) return auth;
  if (!embeddingsConfigured()) return NextResponse.json({ error: "GEMINI_API_KEY belum dikonfigurasi" }, { status: 503 });
  const rate = await consumeRateLimit({ actorId: auth.uid, action: "knowledge-reindex", limit: 3, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Batas reindex tercapai. Coba kembali beberapa saat lagi." },
    { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const snap = await adminDb.collection("knowledge_documents").where("status", "==", "approved").limit(200).get();
  let indexed = 0, failed = 0;
  for (const doc of snap.docs) {
    try { await indexKnowledgeDocument(doc.id); indexed++; } catch { failed++; }
  }
  return NextResponse.json({ success: failed === 0, indexed, failed, embeddingModel: EMBEDDING_MODEL });
}
