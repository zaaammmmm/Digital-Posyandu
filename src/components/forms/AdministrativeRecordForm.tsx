"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export const RECORD_TYPE_LABEL: Record<string, string> = {
  activity: "Kegiatan & jadwal",
  attendance: "Daftar hadir kader",
  minutes: "Notulen",
  home_visit: "Kunjungan rumah",
  inventory: "Inventaris alat",
};

export const AdministrativeRecordForm: React.FC = () => {
  const router = useRouter();
  const [type, setType] = useState("activity");
  const [title, setTitle] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/administration/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, recordDate, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Catatan gagal disimpan.");
      setMessage("Catatan administrasi disimpan.");
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Catatan gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="posyandu-card p-5 space-y-3">
      <h3 className="font-bold text-sm text-slate-900">Tambah catatan</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="posyandu-label" htmlFor="rec-type">Jenis</label>
          <select id="rec-type" className="posyandu-input" value={type} onChange={e => setType(e.target.value)}>
            {Object.entries(RECORD_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="posyandu-label" htmlFor="rec-date">Tanggal</label>
          <input id="rec-date" type="date" required className="posyandu-input" value={recordDate} onChange={e => setRecordDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="posyandu-label" htmlFor="rec-title">Judul</label>
        <input id="rec-title" required maxLength={160} className="posyandu-input" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="posyandu-label" htmlFor="rec-desc">Keterangan</label>
        <textarea id="rec-desc" rows={3} maxLength={4000} className="posyandu-input" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      {message && (
        <p role={isError ? "alert" : "status"} className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium ${isError
          ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p>
      )}
      <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan catatan"}</Button>
    </form>
  );
};
