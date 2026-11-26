"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { HeartPulse, ShieldCheck, ClipboardList, Activity } from "lucide-react";
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
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, posyanduId: posyanduId.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tidak dapat membuat sesi.");
      const destination: Record<string, string> = {
        parent: "/parent",
        cadre: "/cadre",
        health_worker: "/health-worker",
        posyandu_admin: "/admin",
        content_reviewer: "/reviewer",
        system_admin: "/admin",
      };
      router.replace(destination[data.role] || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-story">
        <div className="login-story-orb login-story-orb-one" />
        <div className="login-story-orb login-story-orb-two" />
        <div className="login-story-content">
          <div className="login-brand">
            <span className="login-brand-mark"><HeartPulse size={24} /></span>
            <span>digital<span>posyandu</span></span>
          </div>
          <div className="login-story-copy">
            <span className="login-kicker">LAYANAN KESEHATAN BERBASIS KOMUNITAS</span>
            <h1>Catatan lebih rapi.<br />Pemantauan lebih berarti.</h1>
            <p>Satu ruang untuk membantu kader mencatat layanan, memantau pertumbuhan, dan menjaga kesinambungan informasi keluarga.</p>
          </div>
          <div className="login-feature-list">
            <div><span><ClipboardList size={17} /></span><p><strong>Pencatatan terstruktur</strong><small>Riwayat layanan dalam satu alur.</small></p></div>
            <div><span><Activity size={17} /></span><p><strong>Pemantauan berkelanjutan</strong><small>Data kunjungan mudah ditelusuri.</small></p></div>
            <div><span><ShieldCheck size={17} /></span><p><strong>Akses sesuai peran</strong><small>Informasi mengikuti kewenangan pengguna.</small></p></div>
          </div>
          <div className="login-story-foot">Mendukung layanan Posyandu yang tertib dan berorientasi pada keluarga.</div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <span className="login-brand-mark"><HeartPulse size={22} /></span>
            <strong>digital<span>posyandu</span></strong>
          </div>
          <div className="login-form-heading">
            <span className="login-form-eyebrow">SELAMAT DATANG KEMBALI</span>
            <h2>Masuk ke akun Anda</h2>
            <p>Gunakan akun terdaftar untuk melanjutkan ke ruang kerja Posyandu.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Alamat email</label>
              <input id="email" type="email" autoComplete="username" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="nama@contoh.com" className="posyandu-input" />
            </div>
            <div className="login-field">
              <label htmlFor="password">Kata sandi</label>
              <input id="password" type="password" autoComplete="current-password" required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" className="posyandu-input" />
            </div>
            <div className="login-field">
              <label htmlFor="posyanduId">ID Posyandu</label>
              <input id="posyanduId" required value={posyanduId} onChange={(e) => setPosyanduId(e.target.value)}
                placeholder="Masukkan ID Posyandu" className="posyandu-input" />
            </div>
            {error && <p role="alert" className="login-error">{error}</p>}
            <Button type="submit" disabled={loading} className="login-submit">
              {loading ? "Memverifikasi akun..." : "Masuk ke ruang kerja"}
            </Button>
          </form>
          <p className="login-privacy"><ShieldCheck size={15} /> Akses dilindungi autentikasi dan hak akses pengguna.</p>
        </div>
        <div className="login-panel-footer">Digital Posyandu · Layanan kesehatan berbasis komunitas</div>
      </section>
    </main>
  );
}
