import React from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

interface VisitSummaryCardProps {
  summaryText: string;
  sourceDoc?: string;
  generatedAt: string;
  safetyStatus: string;
}

export const VisitSummaryCard: React.FC<VisitSummaryCardProps> = ({
  summaryText,
  sourceDoc,
  generatedAt,
  safetyStatus,
}) => {
  const validated = safetyStatus === "passed";
  return (
    <section className="ai-card space-y-4 p-5 sm:p-6" aria-labelledby="visit-summary-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="visit-summary-title" className="text-base font-semibold text-slate-900 sm:text-lg tracking-tight">
          AI Summary
        </h2>
        {validated ? (
          <span className="ai-pill">
            <ShieldCheck size={13} aria-hidden="true" />
            Rekomendasi AI
            <span className="sr-only">, sudah divalidasi</span>
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-[#a7f3d0] bg-white px-3 py-1 text-xs font-medium text-[#047857]">
            Template baku
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-[#0f172a]">{summaryText}</p>
      <div className="flex flex-col gap-1 border-t border-[#a7f3d0] pt-3 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Sumber edukasi: <strong className="font-medium text-slate-800">{sourceDoc || "Tidak ada materi edukasi terlampir"}</strong></span>
        <span>Diperbarui {new Date(generatedAt).toLocaleDateString("id-ID")}</span>
      </div>
      <div className="rounded-[10px] border border-[#a7f3d0] bg-white px-3.5 py-3 text-[13px] leading-relaxed text-slate-600">
        <strong className="font-semibold text-slate-800">Catatan penting. </strong>
        Ringkasan ini merupakan informasi pemantauan rutin, bukan pengganti diagnosis atau konsultasi dengan tenaga kesehatan.
      </div>
    </section>
  );
};
