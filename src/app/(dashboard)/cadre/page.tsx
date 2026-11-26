import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { todayInJakarta } from "@/lib/data/child-lookup";

export default async function CadreDashboard() {
  const ctx = await requirePageContext(["cadre", "health_worker", "posyandu_admin"]);
  const visits = adminDb.collection("visits").where("posyanduId", "==", ctx.posyanduId);
  const [children, today, pending, needsCorrection, rejectedImm, rejectedSupp] = await Promise.all([
    adminDb.collection("children").where("posyanduId", "==", ctx.posyanduId).count().get(),
    visits.where("visitDate", "==", todayInJakarta()).count().get(),
    visits.where("verificationStatus", "==", "pending_verification").count().get(),
    visits.where("verificationStatus", "==", "needs_correction").count().get(),
    adminDb.collection("immunization_events").where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "rejected").count().get(),
    adminDb.collection("supplement_events").where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "rejected").count().get(),
  ]);
  const followUps = needsCorrection.data().count + rejectedImm.data().count + rejectedSupp.data().count;
  return (
    <div className="space-y-6">
      <div className="posyandu-page-header">
        <div>
          <h1 className="posyandu-page-title">Dashboard Kader Posyandu</h1>
          <p className="posyandu-page-subtitle">
            Rekap pelayanan hari kegiatan & administrasi terpadu
          </p>
        </div>
        <Link href="/cadre/children/new">
          <Button>+ Daftarkan Anak</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="posyandu-card p-4 sm:p-5 border-t-4 border-t-slate-400">
          <p className="text-xs font-medium text-slate-500">Sasaran Terdaftar</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5">{children.data().count}</p>
        </div>
        <div className="posyandu-card p-4 sm:p-5 border-t-4 border-t-emerald-600">
          <p className="text-xs font-medium text-slate-500">Kunjungan Hari Ini</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1.5">{today.data().count}</p>
        </div>
        <div className="posyandu-card p-4 sm:p-5 border-t-4 border-t-amber-500">
          <p className="text-xs font-medium text-slate-500">Menunggu Verifikasi</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1.5">{pending.data().count}</p>
        </div>
        <Link href="/cadre/followups" className="posyandu-card p-4 sm:p-5 border-t-4 border-t-rose-500 block">
          <p className="text-xs font-medium text-slate-500">Tindak Lanjut</p>
          <p className="text-2xl sm:text-3xl font-bold text-rose-700 mt-1.5">{followUps}</p>
        </Link>
      </div>

      <div className="posyandu-card p-5 sm:p-6 space-y-3.5">
        <h3 className="font-bold text-sm text-slate-900">Akses Cepat Modul Kader</h3>
        <div className="flex flex-wrap gap-2.5 text-xs font-semibold">
          <Link
            href="/cadre/children"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl transition"
          >
            Daftar Anak
          </Link>
          <Link
            href="/cadre/followups"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl transition"
          >
            Tindak Lanjut
          </Link>
          <Link
            href="/cadre/administration"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl transition"
          >
            Buku Administrasi (Kegiatan, Hadir, Notulen)
          </Link>
          <Link
            href="/cadre/guides"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl transition"
          >
            Pusat Panduan Keterampilan Kader
          </Link>
        </div>
      </div>
    </div>
  );
}
