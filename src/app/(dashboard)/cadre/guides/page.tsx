import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePageContext(["cadre", "health_worker"]);
  const q = ((await searchParams).q || "").trim().slice(0, 100);
  // Only reviewer-approved material is shown to staff.
  const snap = await adminDb.collection("knowledge_documents").where("status", "==", "approved").limit(200).get();
  const needle = q.toLowerCase();
  const docs = rowsOf(snap)
    .filter(d => !needle || [d.title, d.text, ...(Array.isArray(d.keywords) ? d.keywords : [])]
      .some(v => String(v || "").toLowerCase().includes(needle)))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Pusat Panduan Keterampilan Kader</h2>
          <p className="posyandu-page-subtitle">Materi acuan teknis pengukuran dan pelayanan</p>
        </div>
      </div>
      <form method="get" className="flex gap-2" role="search">
        <input name="q" defaultValue={q} aria-label="Cari panduan" placeholder="Cari judul, isi, atau kata kunci" className="posyandu-input" />
        <button type="submit" className="rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-emerald-50">Cari</button>
      </form>
      <div className="posyandu-card p-5 sm:p-6 space-y-3 border-l-4 border-l-emerald-600">
        <h4 className="font-semibold text-sm sm:text-base text-emerald-900">
          Panduan Standar Pengukuran Antropometri
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Gunakan infantometer (panjang badan) dengan posisi terlentang untuk balita di bawah usia 24 bulan.
          Gunakan stadiometer (tinggi badan) tegak untuk anak usia 24 bulan ke atas. Selalu pastikan timbangan terkalibrasi ke angka nol.
        </p>
        <p className="text-xs font-medium text-slate-500 pt-1">
          Sumber: Petunjuk Teknis Antropometri Kemenkes RI
        </p>
      </div>
      {docs.length === 0 && (
        <div className="posyandu-card p-5 text-sm text-slate-600">
          {q ? "Tidak ada materi yang cocok dengan pencarian." : "Belum ada materi tambahan yang disahkan reviewer."}
        </div>
      )}
      {docs.map(d => (
        <article key={d.id} className="posyandu-card p-5 sm:p-6 space-y-2">
          <h4 className="font-semibold text-sm sm:text-base text-slate-900">{String(d.title)}</h4>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">{String(d.text).slice(0, 1200)}</p>
          <p className="text-xs font-medium text-slate-500">
            Sumber: {String(d.sourceTitle)} &bull; Versi {String(d.version)}
            {d.reviewedAt ? <> &bull; disahkan {String(d.reviewedAt).slice(0, 10)}</> : null}
            {/^https?:\/\//i.test(String(d.sourceUrl || "")) ? <> &bull; <a className="text-emerald-700 hover:underline" href={String(d.sourceUrl)} target="_blank" rel="noreferrer noopener">tautan sumber</a></> : null}
          </p>
        </article>
      ))}
    </div>
  );
}
