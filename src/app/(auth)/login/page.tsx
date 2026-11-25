"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("cadre");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full posyandu-card p-6 sm:p-8 shadow-md space-y-6">
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Sistem Informasi Posyandu
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
            Digital Posyandu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Sistem Buku Posyandu dan Administrasi Terpadu
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="posyandu-label">Pilih Peran Demo</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="posyandu-input"
            >
              <option value="cadre">Kader Posyandu</option>
              <option value="parent">Orang Tua / Wali</option>
              <option value="health-worker">Bidan / Tenaga Kesehatan</option>
              <option value="admin">Administrator Posyandu</option>
              <option value="reviewer">Reviewer Konten Kesehatan</option>
            </select>
          </div>
          <Button type="submit" className="w-full py-3">
            Masuk ke Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}
