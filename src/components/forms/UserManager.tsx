"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export type ManagedUser = { uid: string; email: string; displayName: string; role: string; status: string };

const ROLE_LABEL: Record<string, string> = {
  parent: "Orang tua/wali", cadre: "Kader", health_worker: "Bidan/tenaga kesehatan",
  posyandu_admin: "Administrator Posyandu", content_reviewer: "Reviewer konten", system_admin: "Pengelola sistem",
};
const ASSIGNABLE = ["cadre", "health_worker", "parent", "posyandu_admin", "content_reviewer"];

export const UserManager: React.FC<{ users: ManagedUser[]; selfUid: string }> = ({ users, selfUid }) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cadre");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const report = (text: string, error: boolean) => { setMessage(text); setIsError(error); };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    report("", false);
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Akun gagal dibuat.");
      report(`Akun dibuat. UID: ${data.uid}. Sampaikan kata sandi awal melalui jalur yang aman.`, false);
      setEmail(""); setDisplayName(""); setPassword("");
      router.refresh();
    } catch (err) {
      report(err instanceof Error ? err.message : "Akun gagal dibuat.", true);
    } finally { setBusy(false); }
  };

  const setStatus = async (user: ManagedUser, status: "active" | "inactive") => {
    setBusy(true);
    report("", false);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, role: user.role, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Status gagal diubah.");
      router.refresh();
    } catch (err) {
      report(err instanceof Error ? err.message : "Status gagal diubah.", true);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={createUser} className="posyandu-card p-5 sm:p-6 space-y-4">
        <h3 className="font-semibold text-sm sm:text-base text-slate-900">Tambah pengguna</h3>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="posyandu-label" htmlFor="u-email">Email</label>
            <input id="u-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="posyandu-input" />
          </div>
          <div>
            <label className="posyandu-label" htmlFor="u-name">Nama tampilan</label>
            <input id="u-name" required value={displayName} onChange={e => setDisplayName(e.target.value)} className="posyandu-input" />
          </div>
          <div>
            <label className="posyandu-label" htmlFor="u-pass">Kata sandi awal (min. 12 karakter)</label>
            <input id="u-pass" type="password" required minLength={12} autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)} className="posyandu-input" />
          </div>
          <div>
            <label className="posyandu-label" htmlFor="u-role">Peran</label>
            <select id="u-role" value={role} onChange={e => setRole(e.target.value)} className="posyandu-input">
              {ASSIGNABLE.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </div>
        {message && (
          <p role={isError ? "alert" : "status"} className={`rounded-[10px] border px-3.5 py-2.5 text-xs font-medium ${isError
            ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p>
        )}
        <Button type="submit" disabled={busy}>{busy ? "Memproses..." : "Buat akun"}</Button>
      </form>

      <div className="posyandu-table-wrap">
        <table className="posyandu-table">
          <thead className="posyandu-thead">
            <tr>
              <th className="posyandu-th">Nama</th>
              <th className="posyandu-th">Email</th>
              <th className="posyandu-th">Peran</th>
              <th className="posyandu-th">Status</th>
              <th className="posyandu-th">UID</th>
              <th className="posyandu-th">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.uid}>
                <td className="posyandu-td font-semibold text-slate-900">{u.displayName}</td>
                <td className="posyandu-td">{u.email}</td>
                <td className="posyandu-td">{ROLE_LABEL[u.role] || u.role}</td>
                <td className="posyandu-td">{u.status === "active" ? "Aktif" : "Nonaktif"}</td>
                <td className="posyandu-td font-mono text-xs text-slate-500">{u.uid}</td>
                <td className="posyandu-td">
                  {u.uid === selfUid ? <span className="text-xs text-slate-400">Akun Anda</span>
                    : u.status === "active"
                      ? <button className="text-xs font-semibold text-rose-700 hover:underline" disabled={busy} onClick={() => setStatus(u, "inactive")}>Nonaktifkan</button>
                      : <button className="text-xs font-semibold text-emerald-700 hover:underline" disabled={busy} onClick={() => setStatus(u, "active")}>Aktifkan</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
