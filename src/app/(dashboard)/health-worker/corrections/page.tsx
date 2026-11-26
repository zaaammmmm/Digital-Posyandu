import React from "react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { CorrectionReviewActions } from "@/components/forms/CorrectionReviewActions";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Menunggu tinjauan",
  accepted_pending_correction: "Diterima, menunggu koreksi data",
  rejected: "Ditolak",
  corrected: "Sudah dikoreksi",
};

export default async function CorrectionQueuePage() {
  const ctx = await requirePageContext(["health_worker"]);
  const snap = await adminDb.collection("correction_requests").where("posyanduId", "==", ctx.posyanduId).limit(100).get();
  const items = rowsOf(snap)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h1 className="posyandu-page-title">Permintaan Koreksi dari Wali</h1>
          <p className="posyandu-page-subtitle">
            Keputusan di sini hanya mencatat tinjauan. Perubahan nilai dilakukan melalui alur koreksi berversi dan tercatat di audit.
          </p>
        </div>
        <Link href="/health-worker" className="text-sm font-semibold text-emerald-700 hover:underline">Antrean verifikasi</Link>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <div className="posyandu-card p-5 text-sm text-slate-600">Belum ada permintaan koreksi.</div>}
        {items.map(item => (
          <div key={item.id} className="posyandu-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Kunjungan: <Link className="font-mono text-emerald-700 hover:underline" href={`/health-worker/verifications/${String(item.visitId)}`}>{String(item.visitId)}</Link></span>
              <span>{String(item.createdAt).slice(0, 10)} &bull; {STATUS_LABEL[String(item.status)] || String(item.status)}</span>
            </div>
            <p className="text-sm text-slate-800">{String(item.reason)}</p>
            {item.status === "accepted_pending_correction" && (
              <Link href={`/health-worker/verifications/${String(item.visitId)}/correct`}
                className="inline-block text-sm font-semibold text-emerald-700 hover:underline">Koreksi nilai</Link>
            )}
            {item.status === "pending_review"
              ? <CorrectionReviewActions requestId={item.id} />
              : typeof item.reviewNote === "string" && <p className="text-xs text-slate-600">Catatan petugas: {item.reviewNote}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
