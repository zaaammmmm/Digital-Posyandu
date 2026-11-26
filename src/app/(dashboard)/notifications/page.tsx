import React from "react";
import Link from "next/link";
import { requirePageContext } from "@/lib/auth/page-context";
import { getOperationalNotices } from "@/lib/operations/notifications";

export default async function NotificationsPage() {
  const ctx = await requirePageContext();
  const notices = await getOperationalNotices(ctx.posyanduId, ctx.uid, ctx.role);
  return <div className="space-y-5">
    <div className="posyandu-page-header"><div>
      <h1 className="posyandu-page-title">Notifikasi & Pengingat</h1>
      <p className="posyandu-page-subtitle">Daftar pekerjaan operasional yang memerlukan perhatian berdasarkan status data terbaru.</p>
    </div></div>
    <section className="posyandu-card p-5 space-y-3" aria-live="polite">
      {notices.length === 0 && <p className="text-sm text-slate-600">Belum ada notifikasi operasional.</p>}
      {notices.map(n => <article key={n.id} className="border-b border-slate-100 pb-3 last:border-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-sm text-slate-900">{n.title}</h2>
          {n.priority === "high" && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">Prioritas</span>}
        </div>
        <p className="mt-1 text-sm text-slate-600">{n.message}</p>
        <Link href={n.href} className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline">Buka pekerjaan</Link>
      </article>)}
    </section>
    <p className="text-xs text-slate-500">Notifikasi dihitung dari data operasional saat halaman dibuka; pengingat ini bukan diagnosis atau rekomendasi klinis.</p>
  </div>;
}
