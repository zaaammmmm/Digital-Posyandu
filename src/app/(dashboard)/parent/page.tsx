import React from "react";
import { cookies } from "next/headers";
import { requirePageSession } from "@/lib/auth/page-session";
import { adminDb } from "@/lib/firebase/admin";
import { GrowthChart } from "@/components/charts/GrowthChart";

export default async function ParentDashboard() {
  const session = await requirePageSession();
  const cookieStore = await cookies();
  const posyanduId = cookieStore.get("active_posyandu")?.value;
  if (!posyanduId) return <div className="posyandu-card p-5">Pilih Posyandu aktif untuk melihat catatan anak.</div>;
  const membership = await adminDb.collection("memberships").doc(`${session.uid}_${posyanduId}`).get();
  if (!membership.exists || membership.data()?.status !== "active" || membership.data()?.role !== "parent") {
    return <div className="posyandu-card p-5">Akses orang tua tidak tersedia pada Posyandu ini.</div>;
  }
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
        <div className="posyandu-card p-5"><h2 className="font-bold text-slate-900">{selected!.data().fullName}</h2><p className="mt-1 text-sm text-slate-500">Nomor registrasi: {selected!.data().registrationNumber}</p><p className="mt-1 text-sm text-slate-500">Tanggal lahir: {selected!.data().dateOfBirth}</p></div>
        <GrowthChart data={chartData} />
      </>}
    </div>
  );
}
