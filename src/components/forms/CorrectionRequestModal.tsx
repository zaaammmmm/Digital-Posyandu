"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

export const CorrectionRequestModal: React.FC<{
  visitId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ visitId, isOpen, onClose }) => {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");

  if (!isOpen) return null;

  const handleSend = async () => {
    const res = await fetch("/api/corrections/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId,
        requestedBy: "wali-1",
        reason,
      }),
    });
    if (res.ok) {
      setStatus("Permintaan koreksi berhasil dikirim!");
      setTimeout(() => {
        onClose();
        setStatus("");
        setReason("");
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-950/15 sm:p-6">
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold tracking-tight text-slate-900">Ajukan Koreksi Catatan</h3>
          <p className="text-sm leading-relaxed text-slate-500">
            Catatan yang telah diverifikasi tidak dapat diubah langsung. Ajukan koreksi beserta alasan yang jelas.
          </p>
        </div>
        <div>
          <label className="posyandu-label">Alasan Pengajuan Koreksi</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tulis alasan perbaikan (misal: salah input koma desimal)..."
            className="posyandu-input resize-none"
          />
        </div>
        {status && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-800">
            {status}
          </p>
        )}
        <div className="flex flex-col-reverse justify-end gap-2 pt-1 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleSend} disabled={!reason.trim()}>
            Kirim
          </Button>
        </div>
      </div>
    </div>
  );
};
