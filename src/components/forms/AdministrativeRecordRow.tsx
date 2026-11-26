"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES: Record<string, string> = { activity: "Kegiatan & jadwal", attendance: "Daftar hadir kader",
  minutes: "Notulen", home_visit: "Kunjungan rumah", inventory: "Inventaris alat" };

export function AdministrativeRecordRow({ record, canEdit, canDelete }: {
  record: { id: string; type: string; title: string; recordDate: string; description: string };
  canEdit: boolean; canDelete: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(record.title);
  const [recordDate, setRecordDate] = useState(record.recordDate);
  const [description, setDescription] = useState(record.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/administration/records", { method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, title, recordDate, description }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pembaruan gagal.");
      setEditing(false); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Pembaruan gagal."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm("Hapus catatan administrasi ini? Tindakan ini akan dicatat pada audit trail.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/administration/records?id=${encodeURIComponent(record.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Penghapusan gagal.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Penghapusan gagal."); }
    finally { setBusy(false); }
  }
  return <tr>
    <td className="posyandu-td font-mono text-xs whitespace-nowrap">{editing
      ? <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="posyandu-input" />
      : record.recordDate}</td>
    <td className="posyandu-td">{TYPES[record.type] || record.type}</td>
    <td className="posyandu-td font-semibold text-slate-900">{editing
      ? <input value={title} maxLength={160} onChange={e => setTitle(e.target.value)} className="posyandu-input" />
      : record.title}</td>
    <td className="posyandu-td text-slate-600">{editing
      ? <textarea value={description} maxLength={4000} onChange={e => setDescription(e.target.value)} className="posyandu-input" />
      : record.description || "-"}</td>
    {(canEdit || canDelete) && <td className="posyandu-td whitespace-nowrap">
      {editing ? <div className="flex gap-2"><button disabled={busy} onClick={save} className="text-xs font-semibold text-emerald-700">Simpan</button>
        <button disabled={busy} onClick={() => setEditing(false)} className="text-xs text-slate-600">Batal</button></div>
        : <div className="flex gap-2">{canEdit && <button disabled={busy} onClick={() => setEditing(true)} className="text-xs font-semibold text-emerald-700">Ubah</button>}
          {canDelete && <button disabled={busy} onClick={remove} className="text-xs font-semibold text-rose-700">Hapus</button>}</div>}
      {error && <p role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}
    </td>}
  </tr>;
}
