import React from "react";
import { VerificationStatus } from "@/types/verification";

/*
  Lencana status. Mengikuti semantik contoh: hijau = normal, kuning = perlu
  perhatian, merah = bahaya. Latar dibuat lembut dengan teks gelap supaya kontras
  teks 12px tetap lolos WCAG AA (teks putih di atas #F59E0B/#10B981 tidak lolos).
*/
export const StatusBadge: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  const map: Record<
    VerificationStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    draft: { label: "Draft", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
    pending_verification: { label: "Menunggu verifikasi", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-[#f59e0b]" },
    verified: { label: "Terverifikasi", bg: "bg-[#ecfdf5]", text: "text-[#047857]", border: "border-[#a7f3d0]", dot: "bg-[#10b981]" },
    needs_correction: { label: "Perlu koreksi", bg: "bg-red-50", text: "text-red-800", border: "border-red-200", dot: "bg-[#ef4444]" },
    corrected: { label: "Dikoreksi", bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", dot: "bg-sky-500" },
    cancelled: { label: "Dibatalkan", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-300" },
  };

  const item = map[status] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${item.bg} ${item.text} ${item.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} aria-hidden="true" />
      {item.label}
    </span>
  );
};

export const GrowthStatusBadge: React.FC<{
  status: "healthy" | "warning" | "danger";
  label?: string;
}> = ({ status, label }) => {
  const config = {
    healthy: { defaultLabel: "Gizi Baik", className: "bg-[#d1fae5] text-[#065f46]" },
    warning: { defaultLabel: "Perlu Pantauan", className: "bg-[#fef3c7] text-[#92400e]" },
    danger: { defaultLabel: "Risiko Stunting", className: "bg-[#fee2e2] text-[#991b1b]" },
  }[status];

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-normal ${config.className}`}>
      {label || config.defaultLabel}
    </span>
  );
};
