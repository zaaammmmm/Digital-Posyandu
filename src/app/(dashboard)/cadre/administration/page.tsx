import React from "react";

export default function AdministrationPage() {
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Administrasi Posyandu (Digitalisasi Buku)</h2>
          <p className="posyandu-page-subtitle">
            Kelola catatan operasional buku register dan kegiatan rutin
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="posyandu-card-interactive p-5 space-y-1.5">
          <h4 className="font-bold text-sm text-slate-900">Buku Kegiatan & Jadwal</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mencatat agenda posyandu, sasaran kegiatan, dan lokasi pelaksanaan.
          </p>
        </div>
        <div className="posyandu-card-interactive p-5 space-y-1.5">
          <h4 className="font-bold text-sm text-slate-900">Daftar Hadir Kader</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Presensi kader pada hari buka Posyandu.
          </p>
        </div>
        <div className="posyandu-card-interactive p-5 space-y-1.5">
          <h4 className="font-bold text-sm text-slate-900">Buku Notulen & Kunjungan Rumah</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hasil rapat koordinasi dan tindak lanjut kunjungan rumah (home visit).
          </p>
        </div>
        <div className="posyandu-card-interactive p-5 space-y-1.5">
          <h4 className="font-bold text-sm text-slate-900">Buku Inventaris Alat</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Status kalibrasi timbangan, infantometer, dan stadiometer.
          </p>
        </div>
      </div>
    </div>
  );
}
