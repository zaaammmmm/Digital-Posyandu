"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function NewChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [guardianName, setGuardianName] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Data anak dan wali tersimpan.");
    router.push("/cadre/children");
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
              onChange={(e: any) => setSex(e.target.value)}
              className="posyandu-input"
            >
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
        </div>
        <div>
          <label className="posyandu-label">Nama Orang Tua / Wali</label>
          <input
            required
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            className="posyandu-input"
          />
        </div>
        <div>
          <label className="posyandu-label">Kontak Operasional</label>
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Nomor ponsel wali"
            className="posyandu-input"
          />
        </div>
        <Button type="submit" className="w-full mt-2">
          Daftarkan Anak
        </Button>
      </form>
    </div>
  );
}
