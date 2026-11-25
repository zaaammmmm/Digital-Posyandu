import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/audit/audit-logger";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin", "system_admin"]);
  if (isAuthError(auth)) return auth;
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    return NextResponse.json({ error: "Periode from dan to wajib valid (YYYY-MM-DD)" }, { status: 400 });
  }
  const visits = await adminDb.collection("visits").where("posyanduId", "==", auth.posyanduId)
    .where("visitDate", ">=", from).where("visitDate", "<=", to).get();
  const children = await adminDb.collection("children").where("posyanduId", "==", auth.posyanduId).get();
  const measurements = await adminDb.collection("anthropometry_measurements").where("posyanduId", "==", auth.posyanduId).get();
  const verified = visits.docs.filter(d => d.data().verificationStatus === "verified").length;
  const csv = [
    ["Indikator", "Jumlah"],
    ["Anak terdaftar", String(children.size)],
    ["Kunjungan periode", String(visits.size)],
    ["Kunjungan terverifikasi", String(verified)],
    ["Pengukuran tercatat", String(measurements.docs.filter(d => {
      const v = d.data().measuredAt || "";
      return v >= from && v.slice(0, 10) <= to;
    }).length)],
  ].map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");
  await writeAuditLog({ actorUserId: auth.uid, action: "EXPORT_AGGREGATE_REPORT", resourceType: "report",
    resourceId: `${from}_${to}`, beforeSnapshot: null, afterSnapshot: { from, to, visitCount: visits.size },
    reason: "Ekspor rekap agregat", posyanduId: auth.posyanduId });
  return new NextResponse("\uFEFF" + csv, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename=rekap_${from}_${to}.csv`,
    "Cache-Control": "no-store",
  }});
}
