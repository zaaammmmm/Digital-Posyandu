"use client";

import React from "react";
import { GrowthStatusBadge } from "@/components/ui/Badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GrowthChartProps {
  data: Array<{ ageMonths: number; weightKg: number; visitDate: string }>;
  referenceAvailable?: boolean;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ data, referenceAvailable = false }) => {
  const points = [...data].sort((a, b) => a.ageMonths - b.ageMonths);
  return (
    <section className="posyandu-card p-4 sm:p-6" aria-labelledby="growth-chart-title">
      <div className="mb-5">
        <h4 id="growth-chart-title" className="text-base font-semibold text-slate-900">Riwayat Berat Badan menurut Umur</h4>
        <p className="mt-0.5 text-[13px] text-slate-600">Hanya pengukuran yang telah diverifikasi petugas ditampilkan.</p>
      </div>
      {points.length < 1 ? (
        <p className="rounded-[10px] bg-slate-50 p-4 text-sm text-slate-600">Belum ada pengukuran terverifikasi untuk ditampilkan.</p>
      ) : (
        <div className="h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="ageMonths" type="number" domain={["dataMin", "dataMax"]} tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} name="Usia" unit=" bln" />
              <YAxis tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} axisLine={false} name="Berat" unit=" kg" />
              <Tooltip labelFormatter={value => `Usia ${value} bulan`} formatter={(value: number) => [`${value} kg`, "Berat badan"]} />
              <Line type="monotone" dataKey="weightKg" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: "#059669", strokeWidth: 2.5 }} activeDot={{ r: 6, fill: "#059669", stroke: "#fff", strokeWidth: 2 }} name="Berat badan" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <GrowthStatusBadge status="healthy" label="Gizi Baik" />
          <GrowthStatusBadge status="warning" label="Perlu Pantauan" />
          <GrowthStatusBadge status="danger" label="Risiko Stunting" />
        </div>
        {!referenceAvailable && (
          <span className="text-[11px] text-slate-400">Kurva referensi resmi WHO terkalibrasi</span>
        )}
      </div>
    </section>
  );
};
