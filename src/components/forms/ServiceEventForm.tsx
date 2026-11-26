"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

type Kind = "immunization" | "supplement";

export const ServiceEventForm: React.FC<{ childId: string }> = ({ childId }) => {
  const [kind, setKind] = useState<Kind>("immunization");
  const [code, setCode] = useState("");
  const [dose, setDose] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const body = kind === "immunization"
        ? { childId, vaccineCode: code.trim(), doseSequence: dose.trim() || null, administrationDate: date, facility: notes.trim() || null }
        : { childId, supplementType: code.trim(), administrationDate: date, notes: notes.trim() || null };
      const res = await fetch(kind === "immunization" ? "/api/immunizations" : "/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Catatan gagal disimpan.");
      setMessage("Tersimpan, menunggu verifikasi tenaga kesehatan.");
      setCode(""); setDose(""); setNotes("");
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Catatan gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 posyandu-card p-5 sm:p-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-semibold text-slate-900 text-base">Catat Imunisasi / Vitamin</h3>
        <p className="text-xs text-slate-500 mt-0.5">Catatan baru berstatus menunggu verifikasi petugas kesehatan.</p>
      </div>
      <div>
        <label className="posyandu-label" htmlFor="svc-kind">Jenis layanan</label>
        <select id="svc-kind" className="posyandu-input" value={kind} onChange={e => setKind(e.target.value as Kind)}>
          <option value="immunization">Imunisasi</option>
          <option value="supplement">Vitamin / suplemen</option>
        </select>
      </div>
      <div>
        <label className="posyandu-label" htmlFor="svc-code">{kind === "immunization" ? "Kode / nama vaksin" : "Jenis vitamin / suplemen"}</label>
        <input id="svc-code" required className="posyandu-input" value={code} onChange={e => setCode(e.target.value)}
          placeholder={kind === "immunization" ? "Misal: campak" : "Misal: vitamin A"} />
      </div>
      {kind === "immunization" && (
        <div>
          <label className="posyandu-label" htmlFor="svc-dose">Dosis ke (opsional)</label>
          <input id="svc-dose" className="posyandu-input" value={dose} onChange={e => setDose(e.target.value)} />
        </div>
      )}
      <div>
        <label className="posyandu-label" htmlFor="svc-date">Tanggal pemberian</label>
        <input id="svc-date" type="date" required className="posyandu-input" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div>
        <label className="posyandu-label" htmlFor="svc-notes">{kind === "immunization" ? "Fasilitas (opsional)" : "Catatan (opsional)"}</label>
        <input id="svc-notes" className="posyandu-input" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {message && (
        <p role={isError ? "alert" : "status"} className={`rounded-[10px] border px-3.5 py-2.5 text-xs font-medium ${isError
          ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p>
      )}
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Menyimpan..." : "Simpan"}</Button>
    </form>
  );
};
