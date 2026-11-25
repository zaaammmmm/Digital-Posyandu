import React from "react";
import Link from "next/link";

export default function ChildrenListPage() {
  const children = [
    { id: "c1", reg: "REG-001", name: "Muhammad Rayyan", age: "18 Bulan", status: "Aktif" },
    { id: "c2", reg: "REG-002", name: "Aisyah Zahra", age: "8 Bulan", status: "Aktif" },
    { id: "c3", reg: "REG-003", name: "Danendra Putra", age: "24 Bulan", status: "Perlu Verifikasi" },
  ];

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Daftar Anak Terdaftar</h2>
          <p className="posyandu-page-subtitle">Pilih data anak untuk mencatat kunjungan baru</p>
        </div>
      </div>
      <div className="posyandu-table-wrap">
        <table className="posyandu-table">
          <thead className="posyandu-thead">
            <tr>
              <th className="posyandu-th">No. Reg</th>
              <th className="posyandu-th">Nama</th>
              <th className="posyandu-th">Usia</th>
              <th className="posyandu-th">Status</th>
              <th className="posyandu-th">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="posyandu-td font-mono text-xs text-slate-600">{c.reg}</td>
                <td className="posyandu-td font-semibold text-slate-900">{c.name}</td>
                <td className="posyandu-td">{c.age}</td>
                <td className="posyandu-td">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {c.status}
                  </span>
                </td>
                <td className="posyandu-td">
                  <Link
                    href={`/cadre/children/${c.id}/visits/new`}
                    className="text-emerald-700 hover:text-emerald-900 hover:underline font-semibold"
                  >
                    + Catat Kunjungan
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
