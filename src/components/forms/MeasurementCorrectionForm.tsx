"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

type Props = {
  visitId: string;
  initial: { weightKg: number; lengthHeightCm: number; measurementType: "recumbent_length" | "standing_height" };
};

export const MeasurementCorrectionForm: React.FC<Props> = ({ visitId, initial }) => {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState(String(initial.weightKg));
  const [lengthHeightCm, setLengthHeightCm] = useState(String(initial.lengthHeightCm));
  const [measurementType, setMeasurementType] = useState(initial.measurementType);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch(`/api/visits/${encodeURIComponent(visitId)}/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          updatedMeasurements: { weightKg: Number(weightKg), lengthHeightCm: Number(lengthHeightCm), measurementType },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Koreksi gagal disimpan.");
      setMessage("Koreksi tersimpan sebagai versi baru dan menunggu verifikasi ulang.");
      setTimeout(() => router.push(`/health-worker/verifications/${encodeURIComponent(visitId)}`), 1200);
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Koreksi gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="posyandu-label" htmlFor="cor-weight">Berat Badan (kg)</label>
        <input id="cor-weight" type="number" step="0.05" required className="posyandu-input" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
      </div>
      <div>
        <label className="posyandu-label" htmlFor="cor-length">Panjang/Tinggi Badan (cm)</label>
        <input id="cor-length" type="number" step="0.1" required className="posyandu-input" value={lengthHeightCm} onChange={e => setLengthHeightCm(e.target.value)} />
      </div>
      <div>
        <label className="posyandu-label" htmlFor="cor-type">Metode Pengukuran</label>
        <select id="cor-type" className="posyandu-input" value={measurementType}
          onChange={e => setMeasurementType(e.target.value as Props["initial"]["measurementType"])}>
          <option value="standing_height">Berdiri (tinggi badan)</option>
          <option value="recumbent_length">Terlentang (panjang badan)</option>
        </select>
      </div>
      <div>
        <label className="posyandu-label" htmlFor="cor-reason">Alasan koreksi (wajib)</label>
        <textarea id="cor-reason" rows={3} required minLength={5} maxLength={2000} className="posyandu-input" value={reason} onChange={e => setReason(e.target.value)} />
      </div>
      {message && (
        <p role={isError ? "alert" : "status"} className={`rounded-[10px] border px-3.5 py-2.5 text-xs font-medium ${isError
          ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p>
      )}
      <Button type="submit" disabled={loading || reason.trim().length < 5} className="w-full">{loading ? "Menyimpan..." : "Simpan koreksi"}</Button>
    </form>
  );
};
