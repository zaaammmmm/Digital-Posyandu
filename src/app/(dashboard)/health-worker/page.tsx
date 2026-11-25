import React from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";

export default function HealthWorkerDashboard() {
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h1 className="posyandu-page-title">Antrean Verifikasi Bidan / Tenaga Kesehatan</h1>
          <p className="posyandu-page-subtitle">
            Periksa validitas hasil pengukuran sebelum pengesahan dan pembuatan ringkasan otomatis.
          </p>
        </div>
      </div>

      <div className="posyandu-table-wrap">
        <table className="posyandu-table">
          <thead className="posyandu-thead">
            <tr>
              <th className="posyandu-th">Tanggal</th>
              <th className="posyandu-th">Nama Anak</th>
              <th className="posyandu-th">Hasil Pengukuran</th>
              <th className="posyandu-th">Status</th>
              <th className="posyandu-th">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="posyandu-td whitespace-nowrap">25 Nov 2026</td>
              <td className="posyandu-td font-semibold text-slate-900">Muhammad Rayyan</td>
              <td className="posyandu-td">BB: 10.2 kg &bull; TB: 78.4 cm</td>
              <td className="posyandu-td">
                <StatusBadge status="pending_verification" />
              </td>
              <td className="posyandu-td">
                <Link
                  href="/health-worker/verifications/visit-demo-1"
                  className="text-emerald-700 hover:text-emerald-900 hover:underline font-semibold"
                >
                  Tinjau & Validasi
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
