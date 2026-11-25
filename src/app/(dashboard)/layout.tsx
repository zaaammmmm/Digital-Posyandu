import React from "react";
import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession();
  return (
    <div className="dashboard-shell flex flex-col">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white shadow-sm">DP</span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="dashboard-brand-name">Digital Posyandu</span>
            <span className="text-[11px] text-slate-500">Layanan kesehatan terintegrasi</span>
          </div>
          <span className="dashboard-brand-tag hidden sm:inline-flex">Pilot Desa Tempak</span>
        </div>
        <nav aria-label="Navigasi utama" className="dashboard-nav">
          <Link href="/parent">Wali</Link><Link href="/cadre">Kader</Link>
          <Link href="/health-worker">Nakes</Link><Link href="/admin">Admin</Link>
          <form action="/api/auth/logout" method="post"><button type="submit">Keluar</button></form>
        </nav>
      </header>
      <main className="dashboard-main flex-1">{children}</main>
    </div>
  );
}
