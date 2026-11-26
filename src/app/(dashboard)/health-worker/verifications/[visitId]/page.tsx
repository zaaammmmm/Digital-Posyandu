import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { lookupChildLabels } from "@/lib/data/child-lookup";
import { StatusBadge } from "@/components/ui/Badge";
import { VerifyActions } from "@/components/forms/VerifyActions";
import { VerificationStatus } from "@/types/verification";

export default async function VerifyVisitDetailPage({ params }: { params: Promise<{ visitId: string }> }) {
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
  const flags = Array.isArray(meas?.qualityFlags) ? (meas!.qualityFlags as string[]) : [];
  const status = String(visit.verificationStatus) as VerificationStatus;

  return (
    <div className="max-w-lg mx-auto posyandu-card p-6 sm:p-7 space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-900">Verifikasi Catatan Pengukuran</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tinjau hasil antropometri sebelum disahkan</p>
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm space-y-2 text-slate-700">
        <p><strong className="text-slate-900">Anak:</strong> {child ? `${child.fullName} (${child.registrationNumber})` : "-"}</p>
        <p><strong className="text-slate-900">Tanggal kunjungan:</strong> {String(visit.visitDate)}</p>
        <p><strong className="text-slate-900">Status:</strong> <StatusBadge status={status} /></p>
        {meas ? (
          <>
            <p><strong className="text-slate-900">Umur saat pengukuran:</strong> {String(meas.ageMonths)} bulan</p>
            <p><strong className="text-slate-900">Berat Badan:</strong> {String(meas.weightKg)} kg</p>
            <p>
              <strong className="text-slate-900">Panjang/Tinggi:</strong> {String(meas.lengthHeightCm)} cm
              ({meas.measurementType === "recumbent_length" ? "terlentang" : "berdiri"})
            </p>
          </>
        ) : <p className="text-rose-700">Pengukuran aktif tidak ditemukan.</p>}
        <p>
          <strong className="text-slate-900">Modul Pertumbuhan:</strong> interpretasi WHO belum tersedia karena
          dataset referensi resmi dan golden test belum dipasang. Tidak ada Z-score atau klasifikasi yang ditampilkan.
        </p>
        {flags.length > 0 && (
          <p className="text-amber-800"><strong>Penanda kualitas (bukan diagnosis):</strong> {flags.join(", ")}</p>
        )}
        {typeof visit.rejectionReason === "string" && status === "needs_correction" && (
          <p className="text-rose-800"><strong>Alasan penolakan:</strong> {visit.rejectionReason}</p>
        )}
      </div>
      {status === "pending_verification" && meas
        ? <VerifyActions visitId={visitId} />
        : <p className="text-xs text-slate-500">Kunjungan ini tidak berada pada status menunggu verifikasi.</p>}
      {meas && (
        <Link href={`/health-worker/verifications/${visitId}/correct`}
          className="block text-center text-xs font-semibold text-emerald-700 hover:underline">Koreksi nilai pengukuran</Link>
      )}
      <Link href="/health-worker" className="block text-center text-xs font-semibold text-emerald-700 hover:underline">Kembali ke antrean</Link>
    </div>
  );
}
