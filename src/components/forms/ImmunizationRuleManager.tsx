"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import type { ApprovedScheduleRule } from "@/lib/schedule/approved-catalog";

type DraftRule = ApprovedScheduleRule & { id: string };

export const ImmunizationRuleManager: React.FC<{ drafts: DraftRule[] }> = ({ drafts }) => {
  const router = useRouter();
  const [form, setForm] = useState({ vaccineCode: "", name: "", targetAgeMonths: "", version: "", effectiveFrom: "", officialSource: "", sourceDocumentVersion: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const createDraft = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage(""); setIsError(false);
    try {
      const response = await fetch("/api/immunization-rules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, targetAgeMonths: Number(form.targetAgeMonths) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Draft aturan gagal dibuat.");
      setMessage("Draft tersimpan. Aturan belum digunakan sampai disahkan reviewer.");
      setForm({ vaccineCode: "", name: "", targetAgeMonths: "", version: "", effectiveFrom: "", officialSource: "", sourceDocumentVersion: "" });
      router.refresh();
    } catch (error) { setIsError(true); setMessage(error instanceof Error ? error.message : "Draft gagal dibuat."); }
    finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    setLoading(true); setMessage(""); setIsError(false);
    try {
      const response = await fetch(`/api/immunization-rules/${encodeURIComponent(id)}/approve`, { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Aturan gagal disahkan.");
      setMessage("Aturan berhasil disahkan dan dapat digunakan sesuai versi."); router.refresh();
    } catch (error) { setIsError(true); setMessage(error instanceof Error ? error.message : "Aturan gagal disahkan."); }
    finally { setLoading(false); }
  };

  return <div className="space-y-4">
    <form onSubmit={createDraft} className="posyandu-card p-5 sm:p-6 space-y-3">
      <h4 className="font-semibold text-sm sm:text-base text-slate-900">Buat Draft Aturan Imunisasi</h4>
      <p className="text-xs text-slate-500">Masukkan data berdasarkan dokumen resmi. Draft tidak ditampilkan sebagai jadwal kepada wali.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block"><span className="posyandu-label">Kode vaksin</span><input required maxLength={40} className="posyandu-input" value={form.vaccineCode} onChange={e => setForm({ ...form, vaccineCode: e.target.value.toUpperCase() })} /></label>
        <label className="block"><span className="posyandu-label">Nama vaksin</span><input required maxLength={120} className="posyandu-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="block"><span className="posyandu-label">Usia target (bulan)</span><input required type="number" min="0" max="240" step="1" className="posyandu-input" value={form.targetAgeMonths} onChange={e => setForm({ ...form, targetAgeMonths: e.target.value })} /></label>
        <label className="block"><span className="posyandu-label">Versi aturan</span><input required maxLength={64} className="posyandu-input" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} /></label>
        <label className="block"><span className="posyandu-label">Berlaku mulai</span><input required type="date" className="posyandu-input" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} /></label>
        <label className="block"><span className="posyandu-label">Versi dokumen sumber</span><input required maxLength={80} className="posyandu-input" value={form.sourceDocumentVersion} onChange={e => setForm({ ...form, sourceDocumentVersion: e.target.value })} /></label>
      </div>
      <label className="block"><span className="posyandu-label">URL sumber resmi (HTTPS)</span><input required type="url" pattern="https://.*" className="posyandu-input" value={form.officialSource} onChange={e => setForm({ ...form, officialSource: e.target.value })} /></label>
      {message && <p role={isError ? "alert" : "status"} className={`text-xs font-medium ${isError ? "text-rose-700" : "text-emerald-700"}`}>{message}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan sebagai draft"}</Button>
    </form>
    <div className="posyandu-card p-5 sm:p-6 space-y-3">
      <h4 className="font-semibold text-sm sm:text-base text-slate-900">Draft Menunggu Persetujuan ({drafts.length})</h4>
      {drafts.length === 0 && <p className="text-xs text-slate-500">Belum ada draft aturan imunisasi.</p>}
      {drafts.map(rule => <div key={rule.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{rule.name} ({rule.vaccineCode})</strong><span className="text-xs text-amber-700">Draft · v{rule.version}</span></div>
        <p className="text-xs text-slate-600">Target usia: {rule.targetAgeMonths} bulan · Berlaku: {rule.effectiveFrom} · Sumber: {rule.sourceDocumentVersion}</p>
        <a className="text-xs text-emerald-700 underline break-all" href={rule.officialSource} target="_blank" rel="noreferrer noopener">Periksa dokumen sumber</a>
        <Button type="button" disabled={loading} onClick={() => approve(rule.id)}>Sahkan aturan</Button>
      </div>)}
    </div>
  </div>;
};
