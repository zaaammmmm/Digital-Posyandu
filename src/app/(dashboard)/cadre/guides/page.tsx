import React from "react";

export default function GuidesPage() {
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Pusat Panduan Keterampilan Kader</h2>
          <p className="posyandu-page-subtitle">Materi acuan teknis pengukuran dan pelayanan</p>
        </div>
      </div>
      <div className="posyandu-card p-5 sm:p-6 space-y-3 border-l-4 border-l-emerald-600">
        <h4 className="font-bold text-sm sm:text-base text-emerald-900">
          Panduan Standar Pengukuran Antropometri
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Gunakan infantometer (panjang badan) dengan posisi terlentang untuk balita di bawah usia 24 bulan.
          Gunakan stadiometer (tinggi badan) tegak untuk anak usia 24 bulan ke atas. Selalu pastikan timbangan terkalibrasi ke angka nol.
        </p>
        <p className="text-xs font-medium text-slate-500 pt-1">
          Sumber: Petunjuk Teknis Antropometri Kemenkes RI
        </p>
      </div>
    </div>
  );
}
