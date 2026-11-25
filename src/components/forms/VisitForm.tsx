"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

export const VisitForm: React.FC<{ childId: string; posyanduId: string }> = ({
  childId,
  posyanduId,
}) => {
  const [weightKg, setWeightKg] = useState("");
  const [lengthHeightCm, setLengthHeightCm] = useState("");
  const [measurementType, setMeasurementType] = useState<"recumbent_length" | "standing_height">("standing_height");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setIsError(false);

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          posyanduId,
          recordedBy: "kader-1",
          ageMonths: 18,
          measurements: {
            weightKg: Number(weightKg),
            lengthHeightCm: Number(lengthHeightCm),
            measurementType,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsError(false);
        setMsg("Kunjungan dicatat! Menunggu verifikasi tenaga kesehatan.");
        setWeightKg("");
        setLengthHeightCm("");
      } else {
        setIsError(true);
        setMsg(`Error: ${data.error}`);
      }
    } catch {
      setIsError(true);
      setMsg("Gagal menyimpan data kunjungan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 posyandu-card p-5 sm:p-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900 text-base">Form Pencatatan Kunjungan</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Pastikan satuan ukuran sesuai instrumen yang terkalibrasi.
        </p>
      </div>
      <div>
        <label className="posyandu-label">Berat Badan (kg)</label>
        <input
          type="number"
          step="0.05"
          required
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="Misal: 10.2"
          className="posyandu-input"
        />
      </div>
      <div>
        <label className="posyandu-label">Panjang/Tinggi Badan (cm)</label>
        <input
          type="number"
          step="0.1"
          required
          value={lengthHeightCm}
          onChange={(e) => setLengthHeightCm(e.target.value)}
          placeholder="Misal: 78.4"
          className="posyandu-input"
        />
      </div>
      <div>
        <label className="posyandu-label">Metode Pengukuran</label>
        <select
          value={measurementType}
          onChange={(e: any) => setMeasurementType(e.target.value)}
          className="posyandu-input"
        >
          <option value="standing_height">Berdiri (Tinggi Badan &ge; 24 Bulan)</option>
          <option value="recumbent_length">Terlentang (Panjang Badan &lt; 24 Bulan)</option>
        </select>
      </div>
      {msg && (
        <div
          className={`text-xs font-medium px-3.5 py-2.5 rounded-xl border ${
            isError
              ? "text-rose-800 bg-rose-50 border-rose-200"
              : "text-emerald-800 bg-emerald-50 border-emerald-200"
          }`}
        >
          {msg}
        </div>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Menyimpan..." : "Simpan sebagai Draft/Menunggu Verifikasi"}
      </Button>
    </form>
  );
};
