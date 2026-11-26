import React from "react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { calculateAgeMonths } from "@/lib/growth/age";
import { todayInJakarta } from "@/lib/data/child-lookup";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif", archived: "Diarsipkan", needs_verification: "Perlu Verifikasi",
};

function ageLabel(dateOfBirth: string) {
  try {
    const months = calculateAgeMonths(dateOfBirth, todayInJakarta());
    return months < 24 ? `${months} bulan` : `${Math.floor(months / 12)} th ${months % 12} bln`;
  } catch {
    return "-";
  }
}

export default async function ChildrenListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requirePageContext(["cadre", "health_worker", "posyandu_admin"]);
  const snap = await adminDb.collection("children").where("posyanduId", "==", ctx.posyanduId).limit(200).get();
  const q = ((await searchParams).q || "").trim().toLowerCase().slice(0, 100);
  const children = rowsOf(snap)
    .filter(c => !q || String(c.fullName).toLowerCase().includes(q) || String(c.registrationNumber).toLowerCase().includes(q))
    .sort((a, b) => String(a.registrationNumber).localeCompare(String(b.registrationNumber)));
  const canRegister = ctx.role === "cadre" || ctx.role === "posyandu_admin";
  const canRecord = ctx.role === "cadre" || ctx.role === "health_worker";

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Daftar Anak Terdaftar</h2>
          <p className="posyandu-page-subtitle">Pilih data anak untuk mencatat kunjungan baru</p>
        </div>
        {canRegister && (
          <Link href="/cadre/children/new" className="text-sm font-semibold text-emerald-700 hover:underline">+ Daftarkan Anak</Link>
        )}
      </div>
      <form method="get" role="search" className="flex gap-2">
        <input name="q" defaultValue={q} aria-label="Cari anak" placeholder="Cari nama atau nomor registrasi" className="posyandu-input" />
        <button type="submit" className="rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-emerald-50">Cari</button>
      </form>
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
            {children.length === 0 && (
              <tr><td className="posyandu-td text-slate-500" colSpan={5}>{q ? "Tidak ada anak yang cocok dengan pencarian." : "Belum ada anak terdaftar pada Posyandu ini."}</td></tr>
            )}
            {children.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="posyandu-td font-mono text-xs text-slate-600">{String(c.registrationNumber)}</td>
                <td className="posyandu-td font-semibold text-slate-900">{String(c.fullName)}</td>
                <td className="posyandu-td">{ageLabel(String(c.dateOfBirth))}</td>
                <td className="posyandu-td">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {STATUS_LABEL[String(c.recordStatus)] || String(c.recordStatus)}
                  </span>
                </td>
                <td className="posyandu-td">
                  {canRecord && (
                    <Link href={`/cadre/children/${c.id}/visits/new`}
                      className="text-emerald-700 hover:text-emerald-900 hover:underline font-semibold">
                      + Catat Kunjungan
                    </Link>
                  )}
                  {canRecord && (
                    <Link href={`/cadre/children/${c.id}/services/new`}
                      className="ml-3 text-emerald-700 hover:text-emerald-900 hover:underline font-semibold">
                      + Imunisasi/Vitamin
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
