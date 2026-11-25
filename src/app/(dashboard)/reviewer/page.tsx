import React from "react";

export default function ContentReviewerPage() {
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Reviewer Konten Kesehatan & Aturan Imunisasi</h2>
          <p className="posyandu-page-subtitle">
            Validasi katalog jadwal imunisasi dan materi edukasi sebelum digunakan
          </p>
        </div>
      </div>
      <div className="posyandu-card p-5 sm:p-6 space-y-3">
        <h4 className="font-bold text-sm sm:text-base text-slate-900">
          Katalog Aturan Imunisasi Berversi
        </h4>
        <p className="text-xs sm:text-sm text-slate-600">
          Versi aktif: <strong className="text-slate-900">kemenkes-2024.1</strong> &bull; Disahkan oleh Kementerian Kesehatan RI.
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Status: Terverifikasi & Terkunci
        </span>
      </div>
    </div>
  );
}
