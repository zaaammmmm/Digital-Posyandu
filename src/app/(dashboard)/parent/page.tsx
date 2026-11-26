import React from "react";
import { requirePageContext } from "@/lib/auth/page-context";
import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";
import { GrowthChart } from "@/components/charts/GrowthChart";

export default async function ParentDashboard() {
  // Role comes from the active membership; other roles are redirected to their own home.
  const session = await requirePageContext(["parent"]);
  const posyanduId = session.posyanduId;
  const childrenSnap = await adminDb.collection("children").where("posyanduId", "==", posyanduId).where("guardianUids", "array-contains", session.uid).limit(50).get();
  const children = childrenSnap.docs;
  const selected = children[0];
  let chartData: Array<{ ageMonths: number; weightKg: number; visitDate: string }> = [];
  if (selected) {
    const measurements = await adminDb.collection("anthropometry_measurements").where("childId", "==", selected.id).where("posyanduId", "==", posyanduId).where("verificationStatus", "==", "verified").limit(100).get();
    chartData = measurements.docs.filter(d => !d.data().supersededAt).map(d => ({ ageMonths: Number(d.data().ageMonths), weightKg: Number(d.data().weightKg), visitDate: String(d.data().measuredAt || "") })).filter(d => Number.isFinite(d.ageMonths) && Number.isFinite(d.weightKg));
  }
  return (
    <div className="space-y-6">
      <div className="posyandu-page-header"><div><h1 className="posyandu-page-title">Catatan Pertumbuhan Anak</h1><p className="posyandu-page-subtitle">Data anak dan pengukuran terverifikasi pada Posyandu aktif.</p></div></div>
      {children.length === 0 ? <div className="posyandu-card p-5 text-sm text-slate-600">Belum ada profil anak yang terhubung dengan akun wali ini.</div> : <>
        <div className="posyandu-card p-5"><h2 className="font-semibold text-slate-900">{selected!.data().fullName}</h2><p className="mt-1 text-sm text-slate-500">Nomor registrasi: {selected!.data().registrationNumber}</p><p className="mt-1 text-sm text-slate-500">Tanggal lahir: {selected!.data().dateOfBirth}</p></div>
        <div className="posyandu-card p-5 space-y-2"><h3 className="font-semibold text-sm text-slate-900">Profil dan riwayat lengkap</h3><ul className="space-y-1 text-sm">{children.map(c => <li key={c.id}><Link className="font-semibold text-emerald-700 hover:underline" href={`/parent/children/${c.id}`}>{String(c.data().fullName)}</Link></li>)}</ul></div>
        <GrowthChart data={chartData} />
      </>}
    </div>
  );
}
