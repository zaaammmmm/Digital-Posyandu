import React from "react";
import { VisitSummaryCard } from "@/components/ai/VisitSummaryCard";
import { GrowthChart } from "@/components/charts/GrowthChart";

export default function ParentDashboard() {
  const chartData = [
    { month: 0, weight: 3.2, medianWho: 3.2, plus2Sd: 4.2, minus2Sd: 2.4 },
    { month: 6, weight: 7.5, medianWho: 7.3, plus2Sd: 8.8, minus2Sd: 6.0 },
    { month: 12, weight: 9.6, medianWho: 9.2, plus2Sd: 10.8, minus2Sd: 7.7 },
    { month: 18, weight: 10.2, medianWho: 10.2, plus2Sd: 12.2, minus2Sd: 8.8 },
  ];

  return (
    <div className="space-y-6">
      <div className="posyandu-page-header">
        <div>
          <h1 className="posyandu-page-title">Catatan Pertumbuhan Anak</h1>
          <p className="posyandu-page-subtitle">Profil: Muhammad Rayyan (18 Bulan)</p>
        </div>
      </div>

      <VisitSummaryCard
        summaryText="Pada kunjungan 12 November 2026, berat badan tercatat 10,2 kg dan tinggi badan 78,4 cm. Dibandingkan kunjungan 12 Oktober 2026, berat badan tercatat bertambah 0,2 kg. Posisi pertumbuhan berada dalam batas standar baku WHO. Informasi ini bersifat pemantauan rutin dan bukan diagnosis medis."
        generatedAt="2026-11-25T10:00:00Z"
        safetyStatus="passed"
      />

      <GrowthChart data={chartData} />

      <div className="posyandu-card p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-900">
            Jadwal Imunisasi Berikutnya (Telah Disahkan)
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 ring-1 ring-sky-200">
            Terjadwal
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          Campak-Rubela (MR) Lanjutan &bull; Usia 18 Bulan &bull; Sumber: Katalog Resmi Kemenkes
        </p>
      </div>
    </div>
  );
}
