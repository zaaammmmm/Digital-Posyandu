import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";

export default async function AuditLogsPage() {
  const ctx = await requirePageContext(["posyandu_admin", "health_worker", "system_admin"]);
  const snap = await adminDb.collection("audit_logs").where("posyanduId", "==", ctx.posyanduId).limit(300).get();
  const logs = rowsOf(snap)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 100);

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Jejak Audit Sistem (Audit Trail)</h2>
          <p className="posyandu-page-subtitle">
            100 aktivitas terbaru pada Posyandu aktif. Log hanya dapat ditulis oleh server dan tidak dapat diubah dari klien.
          </p>
        </div>
      </div>
      <div className="posyandu-table-wrap">
        <table className="posyandu-table">
          <thead className="posyandu-thead">
            <tr>
              <th className="posyandu-th">Waktu</th>
              <th className="posyandu-th">Aksi</th>
              <th className="posyandu-th">Petugas (UID)</th>
              <th className="posyandu-th">Resource</th>
              <th className="posyandu-th">Alasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 && <tr><td className="posyandu-td text-slate-500" colSpan={5}>Belum ada aktivitas tercatat.</td></tr>}
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="posyandu-td font-mono text-xs text-slate-600 whitespace-nowrap">{String(l.timestamp).replace("T", " ").slice(0, 16)}</td>
                <td className="posyandu-td font-semibold text-emerald-800 whitespace-nowrap">{String(l.action)}</td>
                <td className="posyandu-td font-mono text-xs whitespace-nowrap">{String(l.actorUserId)}</td>
                <td className="posyandu-td font-mono text-xs text-slate-500">{String(l.resourceType)}/{String(l.resourceId)}</td>
                <td className="posyandu-td text-slate-700">{String(l.reason || "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
