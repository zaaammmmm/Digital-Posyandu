import React from "react";
import { Button } from "@/components/ui/Button";

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Rekapitulasi Layanan Posyandu</h2>
          <p className="posyandu-page-subtitle">
            Laporan rekapitulasi dibuat secara agregat untuk melindungi privasi data pribadi balita.
          </p>
        </div>
      </div>
      <div className="posyandu-card p-5 sm:p-6 space-y-4">
        <h4 className="font-bold text-sm sm:text-base text-slate-900">
          Rekap Bulan Berjalan (November 2026)
        </h4>
        <a href="/api/reports/export?posyanduId=posyandu-tempak" download>
          <Button>Unduh Rekapitulasi (CSV)</Button>
        </a>
      </div>
    </div>
  );
}
