import React from "react";
import Link from "next/link";
import { requirePageContext } from "@/lib/auth/page-context";
import { adminDb } from "@/lib/firebase/admin";

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function score(a: string, b: string) {
  const aa = new Set(normalize(a).split(" ").filter(Boolean));
  const bb = new Set(normalize(b).split(" ").filter(Boolean));
  return aa.size && bb.size ? [...aa].filter(x => bb.has(x)).length / new Set([...aa, ...bb]).size : 0;
}
export default async function DuplicateChildrenPage({ searchParams }: { searchParams: Promise<{ name?: string; dob?: string }> }) {
  const ctx = await requirePageContext(["cadre", "posyandu_admin", "health_worker"]);
  const params = await searchParams;
  const name = (params.name || "").trim().slice(0, 100);
  const dob = params.dob || "";
  const snap = name.length >= 3 ? await adminDb.collection("children").where("posyanduId", "==", ctx.posyanduId).limit(500).get() : null;
  const matches = (snap?.docs || []).map(d => ({ id: d.id, ...d.data() }))
    .map((c: any) => ({ id: c.id, name: String(c.fullName || ""), dob: String(c.dateOfBirth || ""),
      reg: String(c.registrationNumber || ""), score: Math.max(score(name, String(c.fullName || "")), dob && dob === c.dateOfBirth ? 0.85 : 0) }))
    .filter(c => c.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 30);
  return <div className="space-y-5">
    <div className="posyandu-page-header"><div><h1 className="posyandu-page-title">Pemeriksaan Data Anak Duplikat</h1>
      <p className="posyandu-page-subtitle">Pemeriksaan indikatif berdasarkan kemiripan nama dan tanggal lahir dalam Posyandu aktif.</p></div></div>
    <form method="get" className="posyandu-card p-5 grid gap-3 sm:grid-cols-2">
      <div><label className="posyandu-label" htmlFor="dup-name">Nama anak</label><input id="dup-name" name="name" minLength={3} required defaultValue={name} className="posyandu-input" /></div>
      <div><label className="posyandu-label" htmlFor="dup-dob">Tanggal lahir (opsional)</label><input id="dup-dob" name="dob" type="date" defaultValue={dob} className="posyandu-input" /></div>
      <div className="sm:col-span-2"><button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Periksa kemiripan</button></div>
    </form>
    {name.length >= 3 && <section className="posyandu-card p-5 space-y-3">
      <h2 className="font-semibold text-sm">Kandidat ({matches.length})</h2>
      <p className="text-xs text-slate-500">Persentase adalah skor kemiripan, bukan bukti bahwa dua data merupakan orang yang sama. Verifikasi manual sebelum menggabungkan atau mengubah data.</p>
      {matches.length === 0 && <p className="text-sm text-slate-600">Tidak ditemukan kandidat yang cukup mirip pada 500 data pertama.</p>}
      {matches.map(m => <article key={m.id} className="border-t border-slate-100 pt-3">
        <p className="font-semibold text-sm">{m.name} <span className="font-normal text-slate-500">({Math.round(m.score * 100)}% mirip)</span></p>
        <p className="text-xs text-slate-600">No. registrasi: {m.reg} · Tanggal lahir: {m.dob}</p>
        <Link href={`/cadre/children/${m.id}/visits/new`} className="text-xs font-semibold text-emerald-700 hover:underline">Buka data anak</Link>
      </article>)}
    </section>}
  </div>;
}
