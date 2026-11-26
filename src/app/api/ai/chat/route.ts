import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { createHash } from "node:crypto";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { runEducationChat } from "@/lib/ai/rag-chat";
import { RAG_PROMPT_VERSION } from "@/lib/ai/rag-pipeline";

/**
 * General education chatbot. It never receives child records: the only input is a short,
 * identifier-redacted question. The raw question is not stored; only a hash and outcome metadata.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["parent", "cadre", "health_worker"]);
  if (isAuthError(auth)) return auth;
  const rate = await consumeRateLimit({ actorId: auth.uid, action: "ai-chat", limit: 12, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Batas pertanyaan tercapai. Coba kembali beberapa saat lagi." },
    { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  let body: { question?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 }); }
  try {
    const { response, provenance } = await runEducationChat(body.question);
    const sha = (v: string) => createHash("sha256").update(v).digest("hex");
    await adminDb.collection("ai_chat_events").add({
      posyanduId: auth.posyanduId, actorHash: sha(auth.uid),
      questionHash: typeof body.question === "string" ? sha(body.question.trim().toLowerCase()) : null,
      questionLength: typeof body.question === "string" ? body.question.length : 0,
      status: response.status, reasonCodes: response.reasonCodes, retrievalMode: response.retrievalMode,
      knowledgeSourceIds: provenance.sourceIds, citedDocumentIds: response.citations.map(c => c.documentId),
      modelProvider: provenance.modelProvider, modelVersion: provenance.modelVersion,
      embeddingModel: provenance.embeddingModel, promptVersion: RAG_PROMPT_VERSION,
      createdAt: new Date().toISOString(),
    });
    const { reasonCodes: _omit, ...publicResponse } = response;
    void _omit;
    return NextResponse.json(publicResponse);
  } catch {
    return NextResponse.json({ error: "Chatbot tidak dapat menjawab saat ini. Silakan tanyakan kepada petugas Posyandu." }, { status: 500 });
  }
}
