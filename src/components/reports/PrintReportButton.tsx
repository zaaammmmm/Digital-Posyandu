"use client";
import React from "react";
export function PrintReportButton() {
  return <button type="button" onClick={() => window.print()}
    className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white print:hidden">
    Cetak / Simpan PDF
  </button>;
}
