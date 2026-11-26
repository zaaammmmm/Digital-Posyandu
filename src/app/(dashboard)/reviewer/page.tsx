import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import type { Row } from "@/lib/data/rows";
import { KnowledgeReviewActions } from "@/components/forms/KnowledgeReviewActions";
import { isScheduleRuleUsable, ApprovedScheduleRule } from "@/lib/schedule/approved-catalog";

export default async function ContentReviewerPage() {
  await requirePageContext(["content_reviewer", "system_admin"]);
  const [rulesSnap, knowledgeSnap] = await Promise.all([
    adminDb.collection("immunization_schedule_rules").limit(200).get(),
    adminDb.collection("knowledge_documents").limit(200).get(),
  ]);
  const rules = rulesSnap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as unknown as ApprovedScheduleRule);
  const usable = rules.filter(isScheduleRuleUsable);
  const knowledgeApproved = knowledgeSnap.docs.filter(d => d.data().status === "approved").length;
  const pending = knowledgeSnap.docs
    .filter(d => d.data().status === "pending_review")
    .map((d): Row => ({ ...(d.data() as Record<string, unknown>), id: d.id }));

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Reviewer Konten Kesehatan &amp; Aturan Imunisasi</h2>
          <p className="posyandu-page-subtitle">Status katalog dan materi yang telah disahkan. Data ini dibaca langsung dari basis data.</p>
        </div>
      </div>
      <div className="posyandu-card p-5 sm:p-6 space-y-3">
        <h4 className="font-bold text-sm sm:text-base text-slate-900">Katalog Aturan Imunisasi Berversi</h4>
        {usable.length === 0 ? (
          <p className="text-xs sm:text-sm text-amber-800">
            Belum ada aturan imunisasi yang disahkan dengan metadata lengkap. Jadwal dan pengingat imunisasi tidak ditampilkan
            kepada wali sampai katalog resmi disahkan tenaga kesehatan berwenang.
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-slate-600">
            {usable.length} aturan disahkan dan memenuhi metadata sumber, versi, serta persetujuan
            (dari {rules.length} aturan tersimpan).
          </p>
        )}
      </div>
      <div className="posyandu-card p-5 sm:p-6 space-y-2">
        <h4 className="font-bold text-sm sm:text-base text-slate-900">Materi Edukasi (Knowledge Base)</h4>
        <p className="text-xs sm:text-sm text-slate-600">
          {knowledgeApproved} dokumen berstatus approved dari {knowledgeSnap.size} dokumen tersimpan.
        </p>
      </div>
      <div className="posyandu-card p-5 sm:p-6 space-y-4">
        <h4 className="font-bold text-sm sm:text-base text-slate-900">Menunggu Peninjauan ({pending.length})</h4>
        {pending.length === 0 && <p className="text-xs sm:text-sm text-slate-600">Tidak ada materi yang menunggu peninjauan.</p>}
        {pending.map(doc => (
          <div key={doc.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-900">{String(doc.title)}</p>
            <p className="text-xs text-slate-500">
              Sumber: {String(doc.sourceTitle)} &bull; Versi {String(doc.version)}
              {doc.sourceUrl ? <> &bull; <a className="text-emerald-700 hover:underline" href={String(doc.sourceUrl)} target="_blank" rel="noreferrer noopener">tautan sumber</a></> : null}
            </p>
            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line">{String(doc.text).slice(0, 600)}</p>
            <KnowledgeReviewActions documentId={doc.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
