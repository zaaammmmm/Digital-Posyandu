import React from "react";

export default function AuditLogsPage() {
  const sampleLogs = [
    {
      id: "log-1",
      action: "VERIFY_VISIT",
      actor: "bidan-desa-1",
      resource: "visit/visit-demo-1",
      reason: "Verifikasi data kunjungan oleh petugas berwenang",
      time: "2026-11-25 10:15",
    },
    {
      id: "log-2",
      action: "CORRECT_VISIT_DATA",
      actor: "bidan-desa-1",
      resource: "visit/visit-demo-0",
      reason: "Koreksi salah ketik tinggi badan dari 71 menjadi 74 cm",
      time: "2026-11-20 14:00",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Jejak Audit Sistem (Audit Trail)</h2>
          <p className="posyandu-page-subtitle">
            Catatan riwayat perubahan dan verifikasi yang tidak dapat dihapus
          </p>
        </div>
      </div>
      <div className="posyandu-table-wrap">
        <table className="posyandu-table">
          <thead className="posyandu-thead">
            <tr>
              <th className="posyandu-th">Waktu</th>
              <th className="posyandu-th">Aksi</th>
              <th className="posyandu-th">Petugas</th>
              <th className="posyandu-th">Resource</th>
              <th className="posyandu-th">Alasan Koreksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sampleLogs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="posyandu-td font-mono text-xs text-slate-600 whitespace-nowrap">
                  {l.time}
                </td>
                <td className="posyandu-td font-semibold text-emerald-800 whitespace-nowrap">
                  {l.action}
                </td>
                <td className="posyandu-td whitespace-nowrap">{l.actor}</td>
                <td className="posyandu-td font-mono text-xs text-slate-500">{l.resource}</td>
                <td className="posyandu-td text-slate-700">{l.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
