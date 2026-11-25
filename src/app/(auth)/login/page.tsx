"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [posyanduId, setPosyanduId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, posyanduId: posyanduId.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tidak dapat membuat sesi.");
      const role = data.role;
      const destination: Record<string, string> = {
        parent: "/parent", cadre: "/cadre", health_worker: "/health-worker",
        posyandu_admin: "/admin", content_reviewer: "/reviewer", system_admin: "/admin",
      };
      router.replace(destination[role] || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full posyandu-card p-6 sm:p-8 shadow-md space-y-6">
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Sistem Informasi Posyandu</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">Digital Posyandu</h2>
          <p className="text-xs sm:text-sm text-slate-500">Masuk menggunakan akun terdaftar.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="posyandu-label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="posyandu-input" /></div>
          <div><label className="posyandu-label" htmlFor="password">Kata sandi</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="posyandu-input" /></div>
          <div><label className="posyandu-label" htmlFor="posyanduId">ID Posyandu</label>
            <input id="posyanduId" required value={posyanduId} onChange={e => setPosyanduId(e.target.value)} placeholder="ID tenant Posyandu" className="posyandu-input" /></div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full py-3">{loading ? "Memproses..." : "Masuk"}</Button>
        </form>
      </div>
    </div>
  );
}
