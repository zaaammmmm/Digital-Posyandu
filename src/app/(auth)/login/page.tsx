"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [posyanduId, setPosyanduId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, posyanduId: posyanduId.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Tidak dapat membuat sesi. Periksa kembali data masuk Anda.");
      }

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
      setError(err instanceof Error ? err.message : "Login gagal. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-[#172923] lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,.88fr)]">
      {/* Brand and product context */}
      <section className="relative hidden min-h-screen overflow-hidden border-r border-[#e5ece8] bg-white lg:flex lg:flex-col lg:justify-between lg:px-[clamp(36px,6vw,96px)] lg:py-10 xl:px-24">
        <div className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-[#eaf7f0] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-[-130px] h-[420px] w-[420px] rounded-full border-[70px] border-[#f1f8f4]" />

        <a href="/login" className="relative z-10 inline-flex w-fit items-center gap-3 no-underline" aria-label="Digital Posyandu">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#07865f] text-white shadow-[0_7px_18px_rgba(5,150,105,.18)]">
            <Plus size={25} strokeWidth={2.8} aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-[15px] font-semibold tracking-[-.04em] text-[#142b23]">Digital Posyandu</strong>
            <span className="mt-1 text-[10px] font-medium tracking-[.11em] text-[#84958d]">LAYANAN KESEHATAN TERPADU</span>
          </span>
        </a>

        <div className="relative z-10 mx-auto w-full max-w-[650px] py-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dcefe4] bg-[#f5fbf7] px-3.5 py-2 text-[11px] font-medium text-[#247454]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            Satu ruang kerja untuk layanan Posyandu
          </div>
          <h1 className="max-w-[610px] text-[clamp(38px,4.1vw,58px)] font-semibold leading-[1.13] tracking-[-.065em] text-[#142b23]">
            Data lebih tertata. <span className="text-[#07865f]">Layanan lebih bermakna.</span>
          </h1>
          <p className="mt-6 max-w-[510px] text-[14px] leading-[1.9] text-[#687b72]">
            Kelola pencatatan, pemantauan tumbuh kembang, dan tindak lanjut layanan dalam alur kerja yang terhubung dan mudah dipahami.
          </p>

          {/* Product preview: illustrative only, never presented as live patient data */}
          <div className="mt-11 overflow-hidden rounded-[22px] border border-[#e3ece7] bg-white shadow-[0_18px_55px_rgba(24,57,42,.08)]">
            <div className="flex items-center justify-between border-b border-[#edf2ef] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#e9f7ef] text-[#07865f]"><Activity size={16} /></span>
                <div>
                  <p className="text-[11px] font-semibold text-[#263c32]">Ringkasan pertumbuhan</p>
                  <p className="mt-0.5 text-[9px] text-[#91a098]">Ilustrasi tampilan aplikasi</p>
                </div>
              </div>
              <span className="rounded-full bg-[#f0f8f3] px-2.5 py-1 text-[9px] font-medium text-[#328261]">Data terverifikasi</span>
            </div>
            <div className="grid grid-cols-[1fr_148px] gap-4 p-5">
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between text-[9px] text-[#899991]"><span>Tren berat badan</span><span>6 bulan</span></div>
                <svg viewBox="0 0 420 150" className="h-auto w-full" role="img" aria-label="Ilustrasi grafik tren pertumbuhan">
                  <defs>
                    <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a7f3d0" stopOpacity=".52"/><stop offset="100%" stopColor="#a7f3d0" stopOpacity=".04"/></linearGradient>
                  </defs>
                  <g stroke="#edf2ef" strokeWidth="1"><path d="M0 25H420M0 65H420M0 105H420M0 145H420" /></g>
                  <path d="M0 119 C45 110 66 99 102 96 S164 82 204 76 S266 58 305 55 S373 35 420 27 L420 145 L0 145Z" fill="url(#growthFill)" />
                  <path d="M0 119 C45 110 66 99 102 96 S164 82 204 76 S266 58 305 55 S373 35 420 27" fill="none" stroke="#07865f" strokeWidth="3" strokeLinecap="round" />
                  <g fill="white" stroke="#07865f" strokeWidth="2.5"><circle cx="102" cy="96" r="4"/><circle cx="204" cy="76" r="4"/><circle cx="305" cy="55" r="4"/><circle cx="420" cy="27" r="4"/></g>
                </svg>
                <div className="mt-1 flex justify-between text-[9px] text-[#a0ada6]"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span></div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="rounded-[13px] bg-[#f5faf7] p-3">
                  <p className="text-[9px] text-[#82948a]">Pemantauan</p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-.05em] text-[#1c3b2d]">Teratur</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-[#27835d]"><CheckCircle2 size={11}/> Tercatat</span>
                </div>
                <div className="rounded-[13px] border border-[#edf1ee] p-3">
                  <p className="text-[9px] text-[#82948a]">Alur layanan</p>
                  <div className="mt-2 space-y-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2ef]"><div className="h-full w-[82%] rounded-full bg-[#10b981]" /></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2ef]"><div className="h-full w-[58%] rounded-full bg-[#8ed9b7]" /></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2ef]"><div className="h-full w-[70%] rounded-full bg-[#b8e8d0]" /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-[#edf2ef] bg-[#fbfdfb] px-5 py-3 text-[10px] leading-relaxed text-[#71847a]">
              <ShieldCheck size={14} className="shrink-0 text-[#07865f]" />
              Informasi kesehatan mengikuti proses verifikasi petugas.
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-4 border-t border-[#e8efeb] pt-6">
            <div><p className="text-[10px] font-semibold text-[#365b49]">Pencatatan</p><p className="mt-1 text-[10px] text-[#91a098]">Administrasi terpadu</p></div>
            <div><p className="text-[10px] font-semibold text-[#365b49]">Pemantauan</p><p className="mt-1 text-[10px] text-[#91a098]">Tumbuh kembang</p></div>
            <div><p className="text-[10px] font-semibold text-[#365b49]">Verifikasi</p><p className="mt-1 text-[10px] text-[#91a098]">Jejak layanan</p></div>
          </div>
        </div>

        <p className="relative z-10 text-[10px] text-[#9aa9a1]">© {new Date().getFullYear()} Digital Posyandu. Sistem layanan kesehatan komunitas.</p>
      </section>

      {/* Sign-in form */}
      <section className="relative flex min-h-screen items-center justify-center px-5 py-9 sm:px-8 lg:px-12 xl:px-20">
        <div className="absolute right-8 top-8 hidden items-center gap-2 text-[10px] font-medium text-[#82948a] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" /> Sistem layanan
        </div>

        <div className="w-full max-w-[420px]">
          <a href="/login" className="mb-10 inline-flex items-center gap-2.5 no-underline lg:hidden" aria-label="Digital Posyandu">
            <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#07865f] text-white"><Plus size={23} strokeWidth={2.8}/></span>
            <span className="text-[14px] font-semibold tracking-[-.04em] text-[#17352a]">Digital Posyandu</span>
          </a>

          <div className="mb-9">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-[15px] border border-[#dcefe4] bg-white text-[#07865f] shadow-[0_5px_15px_rgba(28,75,51,.05)]">
              <HeartPulse size={22} strokeWidth={1.8} />
            </div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#07865f]">Selamat datang kembali</p>
            <h2 className="text-[29px] font-semibold leading-tight tracking-[-.055em] text-[#172c23] sm:text-[32px]">Masuk ke akun Anda</h2>
            <p className="mt-3 max-w-[360px] text-[12px] leading-[1.8] text-[#7b8c83]">Masukkan informasi akun yang terdaftar untuk melanjutkan ke ruang kerja Posyandu.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-[11px] font-semibold text-[#40564a]">Alamat email</label>
              <div className="relative">
                <Mail size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa9a1]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@contoh.com"
                  className="h-[50px] w-full rounded-[11px] border border-[#dfe8e3] bg-white pl-11 pr-4 text-[12px] text-[#263c32] outline-none transition placeholder:text-[#b0bbb5] hover:border-[#c5d8cd] focus:border-[#079568] focus:ring-4 focus:ring-[#059669]/[.09]"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-[11px] font-semibold text-[#40564a]">Kata sandi</label>
              </div>
              <div className="relative">
                <LockKeyhole size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa9a1]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="h-[50px] w-full rounded-[11px] border border-[#dfe8e3] bg-white pl-11 pr-12 text-[12px] text-[#263c32] outline-none transition placeholder:text-[#b0bbb5] hover:border-[#c5d8cd] focus:border-[#079568] focus:ring-4 focus:ring-[#059669]/[.09]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#8b9b92] transition hover:bg-[#f1f7f3] hover:text-[#267653] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]/30"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="posyanduId" className="mb-2 block text-[11px] font-semibold text-[#40564a]">ID Posyandu</label>
              <input
                id="posyanduId"
                required
                value={posyanduId}
                onChange={(e) => setPosyanduId(e.target.value)}
                placeholder="Masukkan ID Posyandu"
                autoComplete="organization"
                className="h-[50px] w-full rounded-[11px] border border-[#dfe8e3] bg-white px-4 text-[12px] text-[#263c32] outline-none transition placeholder:text-[#b0bbb5] hover:border-[#c5d8cd] focus:border-[#079568] focus:ring-4 focus:ring-[#059669]/[.09]"
              />
            </div>

            {error && (
              <div role="alert" aria-live="polite" className="flex items-start gap-2.5 rounded-[11px] border border-[#f2d3d0] bg-[#fff8f7] px-3.5 py-3 text-[11px] leading-relaxed text-[#a3443d]">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#fce7e5] text-[10px] font-bold">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 inline-flex h-[51px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#07865f] px-5 text-[12px] font-semibold text-white shadow-[0_7px_16px_rgba(5,150,105,.16)] transition hover:bg-[#047857] hover:shadow-[0_9px_20px_rgba(5,150,105,.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#059669]/25 active:translate-y-px disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Memverifikasi akun...</>
              ) : (
                <>Masuk ke ruang kerja <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 border-t border-[#e5ece8] pt-5">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#07865f]" />
            <p className="text-[10px] leading-[1.8] text-[#8a9a91]">Akun dan data layanan dilindungi autentikasi serta pembatasan akses berdasarkan peran pengguna.</p>
          </div>
          <p className="mt-8 text-center text-[9px] text-[#a1ada6] lg:hidden">© {new Date().getFullYear()} Digital Posyandu</p>
        </div>
      </section>
    </main>
  );
}
