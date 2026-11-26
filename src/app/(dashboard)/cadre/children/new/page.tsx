"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function NewChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [guardianUids, setGuardianUids] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber, fullName: name, dateOfBirth: dob, sex,
          guardianUids: guardianUids.split(",").map(v => v.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Data anak gagal disimpan.");
      router.push("/cadre/children");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data anak gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto posyandu-card p-6 sm:p-7 space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-900">Registrasi Anak & Wali Baru</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Lengkapi identitas dasar sasaran dan wali pendamping
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="posyandu-label">Nomor Registrasi Internal</label>
          <input
            required
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Misal: REG-001"
            className="posyandu-input"
          />
        </div>
        <div>
          <label className="posyandu-label">Nama Lengkap Anak</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="posyandu-input"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="posyandu-label">Tanggal Lahir</label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="posyandu-input"
            />
          </div>
          <div>
            <label className="posyandu-label">Jenis Kelamin</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as "male" | "female")}
              className="posyandu-input"
            >
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
        </div>
        <div>
          <label className="posyandu-label">UID Akun Orang Tua/Wali (opsional, pisahkan dengan koma)</label>
          <input
            value={guardianUids}
            onChange={(e) => setGuardianUids(e.target.value)}
            placeholder="UID akun parent aktif pada Posyandu ini"
            className="posyandu-input"
          />
          <p className="mt-1 text-xs text-slate-500">Nama dan kontak wali tidak disimpan pada tahap ini (minimisasi data).</p>
        </div>
        {error && <p role="alert" className="text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? "Menyimpan..." : "Daftarkan Anak"}
        </Button>
      </form>
    </div>
  );
}
