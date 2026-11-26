import React from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { lookupChildLabels } from "@/lib/data/child-lookup";

export default async function HealthWorkerDashboard() {
  const ctx = await requirePageContext(["health_worker"]);
  const [visitSnap, measSnap, correctionCount] = await Promise.all([
    adminDb.collection("visits").where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "pending_verification").limit(100).get(),
    adminDb.collection("anthropometry_measurements").where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "pending_verification").limit(300).get(),
    adminDb.collection("correction_requests").where("posyanduId", "==", ctx.posyanduId)
      .where("status", "==", "pending_review").count().get(),
  ]);
  const visits = rowsOf(visitSnap)
    .sort((a, b) => String(a.visitDate).localeCompare(String(b.visitDate)));
  const labels = await lookupChildLabels(ctx.posyanduId, visits.map(v => String(v.childId)));
  const measurementByVisit = new Map<string, Record<string, unknown>>();
  for (const d of measSnap.docs) {
    const m = d.data();
    if (!m.supersededAt) measurementByVisit.set(String(m.visitId), m);
  }

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h1 className="posyandu-page-title">Antrean Verifikasi Bidan / Tenaga Kesehatan</h1>
          <p className="posyandu-page-subtitle">
            Periksa validitas hasil pengukuran sebelum pengesahan dan pembuatan ringkasan otomatis.
          </p>
        </div>
        <Link href="/health-worker/corrections" className="text-sm font-semibold text-emerald-700 hover:underline">
          Permintaan koreksi ({correctionCount.data().count})
        </Link>
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
            {visits.length === 0 && (
              <tr><td className="posyandu-td text-slate-500" colSpan={5}>Tidak ada kunjungan yang menunggu verifikasi.</td></tr>
            )}
            {visits.map(v => {
              const m = measurementByVisit.get(v.id);
              const flags = Array.isArray(m?.qualityFlags) ? (m!.qualityFlags as string[]) : [];
              return (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="posyandu-td whitespace-nowrap">{String(v.visitDate)}</td>
                  <td className="posyandu-td font-semibold text-slate-900">{labels.get(String(v.childId))?.fullName || "-"}</td>
                  <td className="posyandu-td">
                    {m ? <>BB: {String(m.weightKg)} kg &bull; TB/PB: {String(m.lengthHeightCm)} cm</> : "Pengukuran tidak ditemukan"}
                    {flags.length > 0 && <span className="ml-2 text-xs text-amber-700">({flags.length} penanda perlu diperiksa)</span>}
                  </td>
                  <td className="posyandu-td"><StatusBadge status="pending_verification" /></td>
                  <td className="posyandu-td">
                    <Link href={`/health-worker/verifications/${v.id}`}
                      className="text-emerald-700 hover:text-emerald-900 hover:underline font-semibold">
                      Tinjau &amp; Validasi
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
