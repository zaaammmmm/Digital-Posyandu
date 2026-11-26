import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { AdministrativeRecordForm } from "@/components/forms/AdministrativeRecordForm";
import { AdministrativeRecordRow } from "@/components/forms/AdministrativeRecordRow";

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
              {(ctx.role === "cadre" || ctx.role === "posyandu_admin") && <th className="posyandu-th">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && <tr><td className="posyandu-td text-slate-500" colSpan={ctx.role === "cadre" || ctx.role === "posyandu_admin" ? 5 : 4}>Belum ada catatan administrasi.</td></tr>}
            {records.map(r => <AdministrativeRecordRow key={r.id}
              record={{ id: String(r.id), type: String(r.type), title: String(r.title),
                recordDate: String(r.recordDate), description: String(r.description || "") }}
              canEdit={ctx.role === "cadre" || ctx.role === "posyandu_admin"}
              canDelete={ctx.role === "posyandu_admin"} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
