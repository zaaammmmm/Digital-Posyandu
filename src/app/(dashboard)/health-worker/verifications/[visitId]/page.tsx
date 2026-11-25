"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function VerifyVisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/visits/${params.visitId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifierId: "bidan-desa-1",
          ageMonths: 18,
          sex: "male",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Data berhasil diverifikasi! Ringkasan AI aman telah dibangkitkan.");
        setTimeout(() => router.push("/health-worker"), 2000);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch {
      setStatus("Gagal memproses verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto posyandu-card p-6 sm:p-7 space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-900">Verifikasi Catatan Pengukuran</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tinjau hasil antropometri dan kalkulasi pertumbuhan deterministik
        </p>
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm space-y-2 text-slate-700">
        <p>
          <strong className="text-slate-900">ID Kunjungan:</strong>{" "}
          <span className="font-mono text-xs">{params.visitId}</span>
        </p>
        <p>
          <strong className="text-slate-900">Berat Badan:</strong> 10.2 kg
        </p>
        <p>
          <strong className="text-slate-900">Panjang/Tinggi:</strong> 78.4 cm (Standing)
        </p>
        <p>
          <strong className="text-slate-900">Modul Pertumbuhan:</strong> WAZ (-0.2 SD), LAZ (-0.5 SD) &bull; Rentang Normal
        </p>
      </div>
      {status && (
        <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
          {status}
        </p>
      )}
      <div className="flex gap-2.5 pt-1">
        <Button onClick={handleVerify} disabled={loading} className="w-full">
          {loading ? "Memproses..." : "Sahkan & Buat Ringkasan"}
        </Button>
      </div>
    </div>
  );
}
