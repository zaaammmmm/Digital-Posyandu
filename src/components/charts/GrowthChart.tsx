"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GrowthChartProps {
  data: Array<{
    month: number;
    weight: number;
    medianWho: number;
    plus2Sd: number;
    minus2Sd: number;
  }>;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ data }) => {
  return (
    <section className="posyandu-card p-4 sm:p-6" aria-labelledby="growth-chart-title">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 id="growth-chart-title" className="text-base font-bold tracking-tight text-slate-900">
            Grafik Pertumbuhan Berat Badan menurut Umur
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Standar Baku WHO Child Growth Standards 2006 &bull; Satuan Kilogram (kg)
          </p>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          Kurva Pemantauan
        </span>
      </div>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={false}
              label={{
                value: "Usia (Bulan)",
                position: "insideBottom",
                offset: -8,
                fill: "#475569",
                fontSize: 11,
              }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={false}
              label={{
                value: "BB (kg)",
                angle: -90,
                position: "insideLeft",
                fill: "#475569",
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }}
            />
            <Line
              type="monotone"
              dataKey="plus2Sd"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="+2 SD"
            />
            <Line
              type="monotone"
              dataKey="medianWho"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              name="Median"
            />
            <Line
              type="monotone"
              dataKey="minus2Sd"
              stroke="#f87171"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="-2 SD"
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#047857"
              strokeWidth={3}
              activeDot={{ r: 6, fill: "#047857", stroke: "#ffffff", strokeWidth: 2 }}
              name="Anak"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
