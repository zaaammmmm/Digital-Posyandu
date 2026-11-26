import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { AI_SUMMARY_NOTICE_VERSION, AI_SUMMARY_PURPOSE, isAiSummaryAllowed } from "@/lib/data/consent";
import { ConsentControl } from "@/components/forms/ConsentControl";

const STATUS_LABEL: Record<string, string> = { granted: "Diberikan", withdrawn: "Dicabut", declined: "Ditolak" };

export default async function ChildPrivacyPage({ params }: { params: Promise<{ childId: string }> }) {
  const ctx = await requirePageContext(["parent"]);
  const { childId } = await params;
  const childSnap = await adminDb.collection("children").doc(childId).get();
  const child = childSnap.data();
  if (!childSnap.exists || !child || child.posyanduId !== ctx.posyanduId
      || !Array.isArray(child.guardianUids) || !child.guardianUids.includes(ctx.uid)) notFound();

  const allowed = await isAiSummaryAllowed(ctx.posyanduId, childId);
  const history = rowsOf(await adminDb.collection("consent_records")
    .where("childId", "==", childId).where("guardianUid", "==", ctx.uid).limit(100).get())
    .filter(r => r.posyanduId === ctx.posyanduId)
    .sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)))
    .slice(0, 20);

  return (
    <div className="max-w-xl space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Privasi &amp; Persetujuan</h2>
          <p className="posyandu-page-subtitle">{String(child.fullName)}</p>
        </div>
      </div>
      <section className="posyandu-card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-slate-900">Ringkasan otomatis (AI)</h3>
        <p className="text-sm text-slate-700">
          Setelah kunjungan disahkan petugas, aplikasi dapat membuat ringkasan singkat dari data terverifikasi.
          Jika persetujuan dicabut, ringkasan baru tidak dibuat dan ringkasan yang sudah ada tidak ditampilkan.
          Data pengukuran dan jadwal tetap tersedia.
        </p>
        <p className="text-xs text-slate-500">Status saat ini: <strong>{allowed ? "Diizinkan" : "Tidak diizinkan"}</strong></p>
        <ConsentControl childId={childId} purpose={AI_SUMMARY_PURPOSE} noticeVersion={AI_SUMMARY_NOTICE_VERSION} allowed={allowed} />
      </section>
      <section className="posyandu-card p-5 space-y-2">
        <h3 className="font-semibold text-sm text-slate-900">Riwayat pilihan</h3>
        {history.length === 0 && <p className="text-sm text-slate-600">Belum ada pilihan yang dicatat.</p>}
        <ul className="space-y-1 text-sm text-slate-800">
          {history.map(h => <li key={h.id}>{String(h.capturedAt).slice(0, 10)} &mdash; {STATUS_LABEL[String(h.consentStatus)] || String(h.consentStatus)}</li>)}
        </ul>
      </section>
      <Link href={`/parent/children/${childId}`} className="block text-xs font-semibold text-emerald-700 hover:underline">Kembali ke profil anak</Link>
    </div>
  );
}
