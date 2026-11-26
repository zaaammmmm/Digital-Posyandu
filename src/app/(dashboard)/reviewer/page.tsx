import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { isScheduleRuleUsable, ApprovedScheduleRule } from "@/lib/schedule/approved-catalog";

export default async function ContentReviewerPage() {
  await requirePageContext(["content_reviewer", "posyandu_admin", "system_admin"]);
  const [rulesSnap, knowledgeSnap] = await Promise.all([
    adminDb.collection("immunization_schedule_rules").limit(200).get(),
    adminDb.collection("knowledge_documents").limit(200).get(),
  ]);
  const rules = rulesSnap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as unknown as ApprovedScheduleRule);
  const usable = rules.filter(isScheduleRuleUsable);
  const knowledgeApproved = knowledgeSnap.docs.filter(d => d.data().status === "approved").length;

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
    </div>
  );
}
