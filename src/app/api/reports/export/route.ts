import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const posyanduId = searchParams.get("posyanduId") || "posyandu-pilot";

  // Data agregat tanpa mengekspos PII anak ke publik
  const aggregateData = [
    ["Indikator", "Jumlah Sasaran"],
    ["Total Balita Terdaftar", "45"],
    ["Kunjungan Bulan Ini", "42"],
    ["Cakupan Imunisasi Lengkap", "91%"],
    ["Pengukuran Sesuai Prosedur", "100%"],
  ];

  const csvContent = aggregateData.map((row) => row.join(",")).join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=rekap_${posyanduId}.csv`,
    },
  });
}
