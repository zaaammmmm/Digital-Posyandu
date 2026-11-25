import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["content_reviewer", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const body = await req.json();
  if (![body.title, body.text, body.sourceTitle, body.version].every(v => typeof v === "string" && v.trim())) {
    return NextResponse.json({ error: "Judul, isi, sumber, dan versi wajib diisi" }, { status: 400 });
  }
  const ref = adminDb.collection("knowledge_documents").doc();
  await ref.set({ title: body.title.trim(), text: body.text.slice(0, 30000),
    sourceTitle: body.sourceTitle.trim(), sourceUrl: body.sourceUrl || null,
    version: body.version.trim(), keywords: Array.isArray(body.keywords) ? body.keywords.slice(0, 30) : [],
    status: "pending_review", createdBy: auth.uid, createdAt: new Date().toISOString() });
  return NextResponse.json({ success: true, documentId: ref.id }, { status: 201 });
}
