"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export const VerifyActions: React.FC<{ visitId: string }> = ({ visitId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const call = async (path: "verify" | "reject", body?: unknown) => {
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch(`/api/visits/${encodeURIComponent(visitId)}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Permintaan gagal diproses.");
      setMessage(path === "verify"
        ? "Kunjungan disahkan. Ringkasan dibuat dari data terverifikasi."
        : "Verifikasi ditolak dan dikembalikan untuk dikoreksi.");
      setTimeout(() => router.push("/health-worker"), 1500);
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Permintaan gagal diproses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {message && (
        <p role={isError ? "alert" : "status"} className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium ${isError
          ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </p>
      )}
      {rejecting && (
        <div>
          <label className="posyandu-label" htmlFor="reject-reason">Alasan penolakan (wajib)</label>
          <textarea id="reject-reason" rows={3} value={reason} onChange={e => setReason(e.target.value)}
            className="posyandu-input resize-none" placeholder="Jelaskan data yang perlu diperiksa ulang..." />
        </div>
      )}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        {!rejecting ? (
          <>
            <Button onClick={() => call("verify")} disabled={loading} className="w-full">
              {loading ? "Memproses..." : "Sahkan & Buat Ringkasan"}
            </Button>
            <Button variant="outline" onClick={() => setRejecting(true)} disabled={loading} className="w-full">
              Tolak / Perlu Koreksi
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" onClick={() => call("reject", { reason })}
              disabled={loading || reason.trim().length < 5} className="w-full">
              {loading ? "Memproses..." : "Kirim Penolakan"}
            </Button>
            <Button variant="outline" onClick={() => setRejecting(false)} disabled={loading} className="w-full">Batal</Button>
          </>
        )}
      </div>
    </div>
  );
};
