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
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState("");
  const [muacCm, setMuacCm] = useState("");
  const [measurementMethod, setMeasurementMethod] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setIsError(false);

    try {
      const idToken = await (await import("@/lib/firebase/client")).auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Silakan login kembali.");
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, "x-posyandu-id": posyanduId },
        body: JSON.stringify({
          childId,
          posyanduId,

          measurements: {
            weightKg: Number(weightKg),
            lengthHeightCm: Number(lengthHeightCm),
            measurementType,
            ...(headCircumferenceCm ? { headCircumferenceCm: Number(headCircumferenceCm) } : {}),
            ...(muacCm ? { muacCm: Number(muacCm) } : {}),
            ...(measurementMethod.trim() ? { measurementMethod: measurementMethod.trim() } : {}),
            ...(equipmentId.trim() ? { equipmentId: equipmentId.trim() } : {}),
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsError(false);
        setMsg("Kunjungan dicatat! Menunggu verifikasi tenaga kesehatan.");
        setWeightKg("");
        setLengthHeightCm("");
        setHeadCircumferenceCm("");
        setMuacCm("");
        setMeasurementMethod("");
        setEquipmentId("");
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
        <h3 className="font-semibold text-slate-900 text-base">Form Pencatatan Kunjungan</h3>
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="posyandu-label" htmlFor="visit-head">Lingkar Kepala (cm)</label>
          <input id="visit-head" type="number" step="0.1" min="20" max="70" value={headCircumferenceCm}
            onChange={(e) => setHeadCircumferenceCm(e.target.value)} placeholder="Opsional" className="posyandu-input" />
        </div>
        <div>
          <label className="posyandu-label" htmlFor="visit-muac">LILA (cm)</label>
          <input id="visit-muac" type="number" step="0.1" min="5" max="35" value={muacCm}
            onChange={(e) => setMuacCm(e.target.value)} placeholder="Opsional" className="posyandu-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="posyandu-label" htmlFor="visit-method">Metode / Cara Ukur</label>
          <input id="visit-method" maxLength={120} value={measurementMethod}
            onChange={(e) => setMeasurementMethod(e.target.value)} placeholder="Opsional" className="posyandu-input" />
        </div>
        <div>
          <label className="posyandu-label" htmlFor="visit-equipment">Alat Ukur (ID)</label>
          <input id="visit-equipment" maxLength={80} value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)} placeholder="Opsional" className="posyandu-input" />
        </div>
      </div>
      {msg && (
        <div
          className={`text-xs font-medium px-3.5 py-2.5 rounded-[10px] border ${
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
