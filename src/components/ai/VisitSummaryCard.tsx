import React from "react";

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
  return (
    <section className="posyandu-card space-y-4 p-5 sm:p-6" aria-labelledby="visit-summary-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-emerald-700">Ringkasan kesehatan</p>
          <h2 id="visit-summary-title" className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Pemantauan Tumbuh Kembang
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          {safetyStatus === "passed" ? "Tervalidasi" : "Template Baku"}
        </span>
      </div>
      <p className="text-sm leading-7 text-slate-700">{summaryText}</p>
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Sumber edukasi: <strong className="font-semibold text-slate-700">{sourceDoc || "Tidak ada materi edukasi terlampir"}</strong></span>
        <span>Diperbarui: {new Date(generatedAt).toLocaleDateString("id-ID")}</span>
      </div>
      <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
        <strong className="font-semibold text-slate-800">Catatan penting. </strong>
        Ringkasan ini merupakan informasi pemantauan rutin, bukan pengganti diagnosis atau konsultasi dengan tenaga kesehatan.
      </div>
    </section>
  );
};
