import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { scanKnowledgeDocument } from "@/lib/ai/prompt-injection";
import { indexKnowledgeDocument } from "@/lib/ai/knowledge-base";

export async function POST(req: NextRequest, ctx: { params: Promise<{ documentId: string }> }) {
  const auth = await requireAuth(req, ["content_reviewer", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const { documentId } = await ctx.params;
  const ref = adminDb.collection("knowledge_documents").doc(documentId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.status !== "pending_review") return NextResponse.json({ error: "Dokumen tidak ditemukan atau status tidak sesuai" }, { status: 404 });
  // Documents seeded outside the create API are re-scanned: injection patterns can never be approved.
  const scan = scanKnowledgeDocument(snap.data() || {});
  if (scan.detected) {
    return NextResponse.json({ error: "Dokumen mengandung pola instruksi untuk AI dan tidak dapat disetujui", codes: scan.codes }, { status: 422 });
  }
  await ref.update({ status: "approved", reviewedBy: auth.uid, reviewedAt: new Date().toISOString() });
  // Embedding is best-effort: if it fails, retrieval degrades to the stricter lexical-only mode.
  let indexed = false;
  try { indexed = (await indexKnowledgeDocument(documentId)).embedded; } catch { indexed = false; }
  return NextResponse.json({ success: true, indexed });
}
