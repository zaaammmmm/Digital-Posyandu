import React from "react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { todayInJakarta } from "@/lib/data/child-lookup";
import { PrintReportButton } from "@/components/reports/PrintReportButton";

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
export default async function PrintableReport({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const ctx = await requirePageContext(["posyandu_admin", "system_admin"]);
  const params = await searchParams;
  const today = todayInJakarta();
  const from = params.from || `${today.slice(0, 8)}01`;
  const to = params.to || today;
  if (!validDate(from) || !validDate(to) || from > to) return <div className="posyandu-card p-5">Periode laporan tidak valid. <Link href="/admin/reports" className="text-emerald-700 underline">Kembali</Link></div>;
  const [children, visits, measurements, immunizations, supplements] = await Promise.all([
    adminDb.collection("children").where("posyanduId", "==", ctx.posyanduId).count().get(),
    adminDb.collection("visits").where("posyanduId", "==", ctx.posyanduId).where("visitDate", ">=", from).where("visitDate", "<=", to).get(),
    adminDb.collection("anthropometry_measurements").where("posyanduId", "==", ctx.posyanduId).get(),
    adminDb.collection("immunization_events").where("posyanduId", "==", ctx.posyanduId).get(),
    adminDb.collection("supplement_events").where("posyanduId", "==", ctx.posyanduId).get(),
  ]);
  const within = (value: unknown) => typeof value === "string" && value.slice(0, 10) >= from && value.slice(0, 10) <= to;
  const verified = visits.docs.filter(d => d.data().verificationStatus === "verified").length;
  const measured = measurements.docs.filter(d => within(d.data().measuredAt)).length;
  const immunizationCount = immunizations.docs.filter(d => within(d.data().administrationDate)).length;
  const supplementCount = supplements.docs.filter(d => within(d.data().administrationDate)).length;
  return <main className="mx-auto max-w-3xl space-y-5 bg-white p-6 text-slate-900 print:max-w-none print:p-0">
    <div className="flex items-center justify-between gap-3 print:hidden">
      <Link href="/admin/reports" className="text-sm text-emerald-700 underline">Kembali ke laporan</Link><PrintReportButton />
    </div>
    <header className="border-b border-slate-300 pb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Digital Posyandu · Laporan agregat</p>
      <h1 className="mt-2 text-2xl font-bold">Rekapitulasi Layanan Posyandu</h1>
      <p className="mt-1 text-sm text-slate-600">Periode {from} sampai {to}</p>
    </header>
    <table className="w-full border-collapse text-sm">
      <thead><tr className="border-b border-slate-300 text-left"><th className="py-2">Indikator</th><th className="py-2 text-right">Jumlah</th></tr></thead>
      <tbody>
        {[["Anak terdaftar (seluruh status)", children.data().count], ["Kunjungan pada periode", visits.size],
          ["Kunjungan terverifikasi", verified], ["Pengukuran tercatat pada periode", measured],
          ["Catatan imunisasi pada periode", immunizationCount], ["Catatan suplemen pada periode", supplementCount]]
          .map(([label, value]) => <tr key={String(label)} className="border-b border-slate-200"><td className="py-3">{label}</td><td className="py-3 text-right font-semibold tabular-nums">{Number(value).toLocaleString("id-ID")}</td></tr>)}
      </tbody>
    </table>
    <p className="text-xs text-slate-500">Laporan ini berisi agregat dan tidak menampilkan identitas anak. Pengukuran dan layanan dihitung berdasarkan tanggal catatan masing-masing.</p>
    <footer className="border-t border-slate-200 pt-3 text-xs text-slate-500">Dibuat pada {today}. Dokumen operasional internal Posyandu.</footer>
  </main>;
}
