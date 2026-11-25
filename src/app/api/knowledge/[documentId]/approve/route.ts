import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function POST(req: NextRequest, ctx: { params: Promise<{ documentId: string }> }) {
  const auth = await requireAuth(req, ["content_reviewer", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const { documentId } = await ctx.params;
  const ref = adminDb.collection("knowledge_documents").doc(documentId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.status !== "pending_review") return NextResponse.json({ error: "Dokumen tidak ditemukan atau status tidak sesuai" }, { status: 404 });
  await ref.update({ status: "approved", reviewedBy: auth.uid, reviewedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
