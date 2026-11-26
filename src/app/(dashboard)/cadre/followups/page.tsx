import React from "react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { lookupChildLabels } from "@/lib/data/child-lookup";

export default async function FollowUpPage() {
  const ctx = await requirePageContext(["cadre"]);
  const [visitSnap, immSnap, suppSnap] = await Promise.all([
    adminDb.collection("visits").where("posyanduId", "==", ctx.posyanduId).where("verificationStatus", "==", "needs_correction").limit(100).get(),
    adminDb.collection("immunization_events").where("posyanduId", "==", ctx.posyanduId).where("verificationStatus", "==", "rejected").limit(100).get(),
    adminDb.collection("supplement_events").where("posyanduId", "==", ctx.posyanduId).where("verificationStatus", "==", "rejected").limit(100).get(),
  ]);
  const visits = rowsOf(visitSnap).sort((a, b) => String(b.rejectedAt || "").localeCompare(String(a.rejectedAt || "")));
  const services = [
    ...rowsOf(immSnap).map(e => ({ id: `i-${e.id}`, childId: String(e.childId), label: `Imunisasi: ${String(e.vaccineCode)}`, date: String(e.administrationDate), reason: String(e.rejectionReason || "-") })),
    ...rowsOf(suppSnap).map(e => ({ id: `s-${e.id}`, childId: String(e.childId), label: `Vitamin: ${String(e.supplementType)}`, date: String(e.administrationDate), reason: String(e.rejectionReason || "-") })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const labels = await lookupChildLabels(ctx.posyanduId, [...visits.map(v => String(v.childId)), ...services.map(s => s.childId)]);
  const name = (id: string) => labels.get(id)?.fullName || "-";

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Tindak Lanjut Kader</h2>
          <p className="posyandu-page-subtitle">Catatan yang dikembalikan petugas kesehatan dan perlu dicatat ulang dengan data yang benar.</p>
        </div>
      </div>
      <section className="posyandu-card p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Kunjungan dikembalikan ({visits.length})</h3>
        {visits.length === 0 && <p className="text-sm text-slate-600">Tidak ada kunjungan yang perlu ditindaklanjuti.</p>}
        {visits.map(v => (
          <div key={v.id} className="border-t border-slate-100 pt-3 space-y-1">
            <p className="text-sm font-semibold text-slate-900">{name(String(v.childId))} &bull; kunjungan {String(v.visitDate)}</p>
            <p className="text-xs text-rose-800">Alasan petugas: {String(v.rejectionReason || "-")}</p>
            <Link href={`/cadre/children/${String(v.childId)}/visits/new`} className="text-xs font-semibold text-emerald-700 hover:underline">Catat ulang kunjungan</Link>
          </div>
        ))}
      </section>
      <section className="posyandu-card p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Imunisasi &amp; vitamin ditolak ({services.length})</h3>
        {services.length === 0 && <p className="text-sm text-slate-600">Tidak ada catatan layanan yang ditolak.</p>}
        {services.map(s => (
          <div key={s.id} className="border-t border-slate-100 pt-3 space-y-1">
            <p className="text-sm font-semibold text-slate-900">{name(s.childId)} &bull; {s.label} &bull; {s.date}</p>
            <p className="text-xs text-rose-800">Alasan petugas: {s.reason}</p>
            <Link href={`/cadre/children/${s.childId}/services/new`} className="text-xs font-semibold text-emerald-700 hover:underline">Catat ulang</Link>
          </div>
        ))}
      </section>
    </div>
  );
}
