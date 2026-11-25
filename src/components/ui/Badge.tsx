import React from "react";
import { VerificationStatus } from "@/types/verification";

export const StatusBadge: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  const map: Record<
    VerificationStatus,
    { label: string; bg: string; text: string; ring: string; dot: string }
  > = {
    draft: {
      label: "Draft",
      bg: "bg-slate-100",
      text: "text-slate-700",
      ring: "ring-slate-300/70",
      dot: "bg-slate-500",
    },
    pending_verification: {
      label: "Menunggu Verifikasi",
      bg: "bg-amber-50",
      text: "text-amber-800",
      ring: "ring-amber-300/80",
      dot: "bg-amber-500",
    },
    verified: {
      label: "Terverifikasi",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      ring: "ring-emerald-300/80",
      dot: "bg-emerald-600",
    },
    needs_correction: {
      label: "Perlu Koreksi",
      bg: "bg-rose-50",
      text: "text-rose-800",
      ring: "ring-rose-300/80",
      dot: "bg-rose-600",
    },
    corrected: {
      label: "Dikoreksi",
      bg: "bg-sky-50",
      text: "text-sky-800",
      ring: "ring-sky-300/80",
      dot: "bg-sky-600",
    },
    cancelled: {
      label: "Dibatalkan",
      bg: "bg-stone-100",
      text: "text-stone-500",
      ring: "ring-stone-300/70",
      dot: "bg-stone-400",
    },
  };

  const item = map[status] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-800",
    ring: "ring-slate-300/70",
    dot: "bg-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset ${item.bg} ${item.text} ${item.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} aria-hidden="true" />
      {item.label}
    </span>
  );
};
