import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { lookupChildLabels } from "@/lib/data/child-lookup";
import { MeasurementCorrectionForm } from "@/components/forms/MeasurementCorrectionForm";

export default async function CorrectVisitPage({ params }: { params: Promise<{ visitId: string }> }) {
  const ctx = await requirePageContext(["health_worker"]);
  const { visitId } = await params;
  const visitSnap = await adminDb.collection("visits").doc(visitId).get();
  const visit = visitSnap.data();
  if (!visitSnap.exists || !visit || visit.posyanduId !== ctx.posyanduId) notFound();
  const measSnap = await adminDb.collection("anthropometry_measurements").where("visitId", "==", visitId).get();
  const meas = measSnap.docs
    .filter(d => !d.data().supersededAt)
    .sort((a, b) => String(b.data().measuredAt || "").localeCompare(String(a.data().measuredAt || "")))[0]?.data();
  const labels = await lookupChildLabels(ctx.posyanduId, [String(visit.childId)]);
  const child = labels.get(String(visit.childId));

  return (
    <div className="max-w-lg mx-auto posyandu-card p-6 sm:p-7 space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">Koreksi Nilai Pengukuran</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {child ? `${child.fullName} (${child.registrationNumber})` : "-"} &bull; kunjungan {String(visit.visitDate)}
        </p>
      </div>
      <p className="rounded-[10px] bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
        Nilai lama tidak dihapus. Koreksi membuat versi baru, mengembalikan kunjungan ke status menunggu verifikasi,
        dan tercatat di audit trail beserta alasannya.
      </p>
      {meas ? (
        <MeasurementCorrectionForm visitId={visitId} initial={{
          weightKg: Number(meas.weightKg), lengthHeightCm: Number(meas.lengthHeightCm),
          measurementType: meas.measurementType === "recumbent_length" ? "recumbent_length" : "standing_height",
        }} />
      ) : <p className="text-sm text-rose-700">Pengukuran aktif tidak ditemukan.</p>}
      <Link href={`/health-worker/verifications/${visitId}`} className="block text-center text-xs font-semibold text-emerald-700 hover:underline">Kembali ke tinjauan</Link>
    </div>
  );
}
