import React from "react";
import { requirePageContext } from "@/lib/auth/page-context";
import { todayInJakarta } from "@/lib/data/child-lookup";

export default async function ReportsPage() {
  await requirePageContext(["posyandu_admin", "system_admin"]);
  const today = todayInJakarta();
  const monthStart = `${today.slice(0, 8)}01`;
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Rekapitulasi Layanan Posyandu</h2>
          <p className="posyandu-page-subtitle">
            Laporan dibuat secara agregat untuk melindungi privasi data pribadi balita. Setiap ekspor dicatat pada audit log.
          </p>
        </div>
      </div>
      <form method="GET" action="/api/reports/export" className="posyandu-card p-5 sm:p-6 space-y-4">
        <h4 className="font-bold text-sm sm:text-base text-slate-900">Pilih periode rekap</h4>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="posyandu-label" htmlFor="from">Dari tanggal</label>
            <input id="from" name="from" type="date" required defaultValue={monthStart} className="posyandu-input" />
          </div>
          <div>
            <label className="posyandu-label" htmlFor="to">Sampai tanggal</label>
            <input id="to" name="to" type="date" required defaultValue={today} className="posyandu-input" />
          </div>
        </div>
        <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-[#176f4f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#105b40]">
          Unduh Rekapitulasi (CSV)
        </button>
      </form>
    </div>
  );
}
