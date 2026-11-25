"use client";

import React, { useState } from "react";
import { CorrectionRequestModal } from "@/components/forms/CorrectionRequestModal";
import { Button } from "@/components/ui/Button";

export default function ChildDetailPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Riwayat Kunjungan Lengkap</h2>
          <p className="posyandu-page-subtitle">Rekam pengukuran yang telah divalidasi petugas</p>
        </div>
      </div>
      <div className="posyandu-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-bold text-sm text-slate-900">Kunjungan 12 November 2026</p>
          <p className="text-xs text-slate-600">
            BB: <strong className="text-slate-800">10.2 kg</strong> &bull; TB:{" "}
            <strong className="text-slate-800">78.4 cm</strong> &bull; Status:{" "}
            <span className="text-emerald-700 font-semibold">Terverifikasi</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => setModalOpen(true)}>
          Minta Koreksi
        </Button>
      </div>
      <CorrectionRequestModal
        visitId="visit-demo-1"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
