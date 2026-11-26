"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GrowthChartProps {
  data: Array<{ ageMonths: number; weightKg: number; visitDate: string }>;
  referenceAvailable?: boolean;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ data, referenceAvailable = false }) => {
  const points = [...data].sort((a, b) => a.ageMonths - b.ageMonths);
  return (
    <section className="posyandu-card p-4 sm:p-6" aria-labelledby="growth-chart-title">
      <div className="mb-4 border-b border-slate-100 pb-4">
        <h4 id="growth-chart-title" className="text-base font-bold tracking-tight text-slate-900">Riwayat Berat Badan menurut Umur</h4>
        <p className="mt-0.5 text-xs text-slate-500">Hanya pengukuran yang telah diverifikasi petugas ditampilkan.</p>
      </div>
      {points.length < 1 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Belum ada pengukuran terverifikasi untuk ditampilkan.</p>
      ) : (
        <div className="h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="ageMonths" type="number" domain={["dataMin", "dataMax"]} tick={{ fill: "#64748b", fontSize: 11 }} name="Usia" unit=" bln" />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} name="Berat" unit=" kg" />
              <Tooltip labelFormatter={value => `Usia ${value} bulan`} formatter={(value: number) => [`${value} kg`, "Berat badan"]} />
              <Line type="monotone" dataKey="weightKg" stroke="#047857" strokeWidth={3} activeDot={{ r: 6 }} name="Berat badan" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {!referenceAvailable && <p className="mt-3 text-xs text-amber-700">Kurva dan klasifikasi standar WHO belum ditampilkan karena dataset referensi resmi berversi serta golden test belum dipasang dan disahkan.</p>}
    </section>
  );
};
