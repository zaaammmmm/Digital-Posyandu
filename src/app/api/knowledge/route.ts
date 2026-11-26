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
  if (body.sourceUrl) {
    let ok = false;
    try { const u = new URL(String(body.sourceUrl)); ok = u.protocol === "https:" || u.protocol === "http:"; } catch { /* invalid */ }
    if (!ok) return NextResponse.json({ error: "Tautan sumber harus berupa URL http atau https" }, { status: 400 });
  }
  const ref = adminDb.collection("knowledge_documents").doc();
  await ref.set({ title: body.title.trim(), text: body.text.slice(0, 30000),
    sourceTitle: body.sourceTitle.trim(), sourceUrl: body.sourceUrl || null,
    version: body.version.trim(), keywords: Array.isArray(body.keywords) ? body.keywords.filter((k: unknown): k is string => typeof k === "string").slice(0, 30) : [],
    status: "pending_review", createdBy: auth.uid, createdAt: new Date().toISOString() });
  return NextResponse.json({ success: true, documentId: ref.id }, { status: 201 });
}
