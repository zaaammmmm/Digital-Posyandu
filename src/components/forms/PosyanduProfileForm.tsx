"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

type Profile = {
  name: string; addressArea: string; village: string; district: string;
  regency: string; province: string; serviceSchedule: string;
};

const FIELDS: { key: keyof Profile; label: string }[] = [
  { key: "name", label: "Nama Posyandu" },
  { key: "addressArea", label: "Alamat / dusun" },
  { key: "village", label: "Desa / kelurahan" },
  { key: "district", label: "Kecamatan" },
  { key: "regency", label: "Kabupaten / kota" },
  { key: "province", label: "Provinsi" },
  { key: "serviceSchedule", label: "Jadwal pelayanan" },
];

export const PosyanduProfileForm: React.FC<{ initial: Profile }> = ({ initial }) => {
  const router = useRouter();
  const [values, setValues] = useState<Profile>(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/posyandu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Profil gagal disimpan.");
      setMessage("Profil Posyandu diperbarui.");
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Profil gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="posyandu-card p-5 sm:p-6 space-y-3 max-w-xl">
      {FIELDS.map(f => (
        <div key={f.key}>
          <label className="posyandu-label" htmlFor={`pf-${f.key}`}>{f.label}</label>
          <input id={`pf-${f.key}`} className="posyandu-input" value={values[f.key]}
            required={f.key === "name"} maxLength={200}
            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} />
        </div>
      ))}
      {message && (
        <p role={isError ? "alert" : "status"} className={`rounded-[10px] border px-3.5 py-2.5 text-xs font-medium ${isError
          ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p>
      )}
      <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan profil"}</Button>
    </form>
  );
};
