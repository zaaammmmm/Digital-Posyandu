import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { generateSafeSummary } from "@/lib/ai/summary-generator";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { isAiSummaryAllowed } from "@/lib/data/consent";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { buildVisitAiPayload, isVisitLike } from "@/lib/ai/visit-payload";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["health_worker"]);
  if (isAuthError(auth)) return auth;
  const rate = await consumeRateLimit({ actorId: auth.uid, action: "ai-summary-generate", limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Batas pembuatan ringkasan tercapai. Coba kembali beberapa saat lagi." },
    { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  try {
    const { visitId } = await req.json();
    if (typeof visitId !== "string") return NextResponse.json({ error: "visitId wajib diisi" }, { status: 400 });
    const visitSnap = await adminDb.collection("visits").doc(visitId).get();
    if (!visitSnap.exists || visitSnap.data()?.posyanduId !== auth.posyanduId || visitSnap.data()?.verificationStatus !== "verified") {
      return NextResponse.json({ error: "Ringkasan hanya dapat dibuat dari kunjungan terverifikasi pada tenant aktif" }, { status: 403 });
    }
    const visitData = visitSnap.data();
    if (!isVisitLike(visitData)) {
      return NextResponse.json({ error: "Data kunjungan tidak lengkap atau tidak valid" }, { status: 422 });
    }
    const visit = visitData;
    if (!(await isAiSummaryAllowed(auth.posyanduId, visit.childId))) {
      return NextResponse.json({ error: "Wali tidak memberi persetujuan untuk ringkasan otomatis" }, { status: 403 });
    }
    const payload = await buildVisitAiPayload({ visitId, visit, posyanduId: auth.posyanduId });
    if (!payload) return NextResponse.json({ error: "Pengukuran aktif yang sudah diverifikasi tidak ditemukan" }, { status: 404 });
    const summary = await generateSafeSummary(payload);
    const ref = await adminDb.collection("ai_summaries").add({
      posyanduId: auth.posyanduId, guardianUid: visit.guardianUid || null, childId: visit.childId, visitId,
      inputRecordVersion: visit.version || 1,
      modelProvider: summary.modelProvider, modelVersion: summary.modelVersion,
      promptVersion: summary.promptVersion, knowledgeSourceIds: payload.approved_education_snippets.map(item => item.id),
      generatedText: summary.text, safetyStatus: summary.safetyStatus,
      reviewStatus: "auto_checked", generatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, summaryId: ref.id, summary: summary.text, safetyStatus: summary.safetyStatus });
  } catch {
    return NextResponse.json({ error: "Ringkasan tidak dapat dibuat; gunakan fallback atau hubungi petugas" }, { status: 500 });
  }
}
