import React from "react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h1 className="posyandu-page-title">Administrasi Posyandu & Pengaturan Sistem</h1>
          <p className="posyandu-page-subtitle">
            Kelola rekapitulasi agregat dan jejak audit sistem
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/admin/reports" className="posyandu-card-interactive p-5 space-y-1.5 block">
          <h4 className="font-bold text-sm text-slate-900">Rekap Layanan & Ekspor CSV</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unduh data agregat Posyandu tanpa PII.
          </p>
        </Link>
        <Link href="/admin/audit-logs" className="posyandu-card-interactive p-5 space-y-1.5 block">
          <h4 className="font-bold text-sm text-slate-900">Audit Trail & Koreksi</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pantau seluruh histori pengubahan data sah.
          </p>
        </Link>
      </div>
    </div>
  );
}
