import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { AdministrativeRecordForm, RECORD_TYPE_LABEL } from "@/components/forms/AdministrativeRecordForm";

export default async function AdministrationPage() {
  const ctx = await requirePageContext(["cadre", "health_worker", "posyandu_admin"]);
  const snap = await adminDb.collection("administrative_records")
    .where("posyanduId", "==", ctx.posyanduId).limit(200).get();
  const records = rowsOf(snap)
    .sort((a, b) => String(b.recordDate).localeCompare(String(a.recordDate)))
    .slice(0, 100);
  const canWrite = ctx.role === "cadre" || ctx.role === "posyandu_admin";

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Administrasi Posyandu (Digitalisasi Buku)</h2>
          <p className="posyandu-page-subtitle">
            Catatan kegiatan, kehadiran kader, notulen, kunjungan rumah, dan inventaris alat. Setiap catatan baru tercatat di audit trail.
          </p>
        </div>
      </div>
      {canWrite && <AdministrativeRecordForm />}
      <div className="posyandu-table-wrap">
        <table className="posyandu-table">
          <thead className="posyandu-thead">
            <tr>
              <th className="posyandu-th">Tanggal</th>
              <th className="posyandu-th">Jenis</th>
              <th className="posyandu-th">Judul</th>
              <th className="posyandu-th">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && <tr><td className="posyandu-td text-slate-500" colSpan={4}>Belum ada catatan administrasi.</td></tr>}
            {records.map(r => (
              <tr key={r.id}>
                <td className="posyandu-td font-mono text-xs whitespace-nowrap">{String(r.recordDate)}</td>
                <td className="posyandu-td">{RECORD_TYPE_LABEL[String(r.type)] || String(r.type)}</td>
                <td className="posyandu-td font-semibold text-slate-900">{String(r.title)}</td>
                <td className="posyandu-td text-slate-600">{String(r.description || "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
