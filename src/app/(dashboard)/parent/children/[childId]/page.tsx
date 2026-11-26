import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { rowsOf } from "@/lib/data/rows";
import { requirePageContext } from "@/lib/auth/page-context";
import { calculateAgeMonths } from "@/lib/growth/age";
import { todayInJakarta } from "@/lib/data/child-lookup";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { VisitSummaryCard } from "@/components/ai/VisitSummaryCard";
import { CorrectionRequestButton } from "@/components/forms/CorrectionRequestButton";
import { isAiSummaryAllowed } from "@/lib/data/consent";
import { getApprovedUpcomingRules, ApprovedScheduleRule } from "@/lib/schedule/approved-catalog";

const REQUEST_LABEL: Record<string, string> = {
  pending_review: "Menunggu tinjauan petugas",
  accepted_pending_correction: "Diterima, menunggu koreksi data oleh petugas",
  rejected: "Ditolak petugas",
  corrected: "Sudah dikoreksi petugas",
};

export default async function ChildDetailPage({ params }: { params: Promise<{ childId: string }> }) {
  const ctx = await requirePageContext(["parent"]);
  const { childId } = await params;
  const childSnap = await adminDb.collection("children").doc(childId).get();
  const child = childSnap.data();
  if (!childSnap.exists || !child || child.posyanduId !== ctx.posyanduId
      || !Array.isArray(child.guardianUids) || !child.guardianUids.includes(ctx.uid)) notFound();

  const [visitSnap, measSnap, immSnap, suppSnap, summarySnap, requestSnap, rulesSnap] = await Promise.all([
    adminDb.collection("visits").where("childId", "==", childId).where("posyanduId", "==", ctx.posyanduId).limit(100).get(),
    adminDb.collection("anthropometry_measurements").where("childId", "==", childId)
      .where("posyanduId", "==", ctx.posyanduId).where("verificationStatus", "==", "verified").limit(100).get(),
    adminDb.collection("immunization_events").where("childId", "==", childId).where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "verified").limit(100).get(),
    adminDb.collection("supplement_events").where("childId", "==", childId).where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "verified").limit(100).get(),
    adminDb.collection("ai_summaries").where("childId", "==", childId).where("posyanduId", "==", ctx.posyanduId).limit(50).get(),
    adminDb.collection("correction_requests").where("requestedBy", "==", ctx.uid).where("posyanduId", "==", ctx.posyanduId).limit(100).get(),
    adminDb.collection("immunization_schedule_rules").where("status", "==", "approved").limit(200).get(),
  ]);

  const summaryAllowed = await isAiSummaryAllowed(ctx.posyanduId, childId);
  const measurements = measSnap.docs.map(d => d.data()).filter(m => !m.supersededAt);
  const measurementByVisit = new Map(measurements.map(m => [String(m.visitId), m]));
  const verifiedVisits = rowsOf(visitSnap)
    .filter(v => v.verificationStatus === "verified")
    .sort((a, b) => String(b.visitDate).localeCompare(String(a.visitDate)));
  const requestsByVisit = new Map(requestSnap.docs.map(d => [String(d.data().visitId), d.data()]));
  const chartData = measurements
    .map(m => ({ ageMonths: Number(m.ageMonths), weightKg: Number(m.weightKg), visitDate: String(m.measuredAt || "") }))
    .filter(m => Number.isFinite(m.ageMonths) && Number.isFinite(m.weightKg));

  // Summary of the latest verified visit; older ones are shown only through history.
  const summary = summarySnap.docs
    .map(d => d.data())
    .filter(s => s.guardianUid === ctx.uid)
    .sort((a, b) => String(b.generatedAt).localeCompare(String(a.generatedAt)))[0];
  let sourceDoc: string | undefined;
  if (summary && Array.isArray(summary.knowledgeSourceIds) && summary.knowledgeSourceIds.length > 0) {
    const docs = await Promise.all(summary.knowledgeSourceIds.slice(0, 5)
      .map((id: string) => adminDb.collection("knowledge_documents").doc(id).get()));
    const titles = docs.map(d => d.data()?.sourceTitle).filter((t): t is string => typeof t === "string" && !!t);
    if (titles.length) sourceDoc = titles.join("; ");
  }

  const immunizations = rowsOf(immSnap)
    .sort((a, b) => String(b.administrationDate).localeCompare(String(a.administrationDate)));
  const supplements = rowsOf(suppSnap)
    .sort((a, b) => String(b.administrationDate).localeCompare(String(a.administrationDate)));
  let ageMonths = -1;
  try { ageMonths = calculateAgeMonths(String(child.dateOfBirth), todayInJakarta()); } catch { /* invalid dob */ }
  const rules = rulesSnap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as unknown as ApprovedScheduleRule);
  const upcoming = getApprovedUpcomingRules(rules, ageMonths, immunizations.map(i => String(i.vaccineCode)));

  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">{String(child.fullName)}</h2>
          <p className="posyandu-page-subtitle">No. registrasi {String(child.registrationNumber)} &bull; lahir {String(child.dateOfBirth)}</p>
        </div>
      </div>

      {summary && summaryAllowed ? (
        <VisitSummaryCard summaryText={String(summary.generatedText)} sourceDoc={sourceDoc}
          generatedAt={String(summary.generatedAt)} safetyStatus={String(summary.safetyStatus)} />
      ) : (
        <div className="posyandu-card p-5 text-sm text-slate-600">{summaryAllowed ? "Ringkasan tersedia setelah kunjungan disahkan petugas." : "Ringkasan otomatis tidak ditampilkan karena persetujuan tidak diberikan."}</div>
      )}

      <Link href={`/parent/children/${childId}/privacy`} className="inline-block text-xs font-semibold text-emerald-700 hover:underline">Privasi &amp; persetujuan</Link>

      <GrowthChart data={chartData} />

      <section className="posyandu-card p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Riwayat Kunjungan Terverifikasi</h3>
        {verifiedVisits.length === 0 && <p className="text-sm text-slate-600">Belum ada kunjungan terverifikasi.</p>}
        {verifiedVisits.map(v => {
          const m = measurementByVisit.get(v.id);
          const request = requestsByVisit.get(v.id);
          return (
            <div key={v.id} className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Kunjungan {String(v.visitDate)}</p>
                <p className="text-xs text-slate-600">
                  {m ? <>BB: <strong>{String(m.weightKg)} kg</strong> &bull; TB/PB: <strong>{String(m.lengthHeightCm)} cm</strong></> : "Pengukuran tidak tersedia"}
                  {" "}&bull; <span className="font-semibold text-emerald-700">Terverifikasi</span>
                </p>
                {request && <p className="text-xs text-amber-800">Permintaan koreksi: {REQUEST_LABEL[String(request.status)] || String(request.status)}</p>}
              </div>
              {!request && <CorrectionRequestButton visitId={v.id} />}
            </div>
          );
        })}
      </section>

      <section className="posyandu-card p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Imunisasi &amp; Jadwal</h3>
        <p className="text-xs text-slate-500">Status &ldquo;belum tercatat&rdquo; tidak berarti belum diberikan. Konfirmasikan dengan Posyandu atau Puskesmas.</p>
        {immunizations.length === 0 ? <p className="text-sm text-slate-600">Belum ada imunisasi terverifikasi pada aplikasi ini.</p> : (
          <ul className="space-y-1 text-sm text-slate-800">
            {immunizations.map(i => <li key={i.id}>{String(i.administrationDate)} &mdash; {String(i.vaccineCode)}{i.doseSequence ? ` (dosis ${String(i.doseSequence)})` : ""}</li>)}
          </ul>
        )}
        {supplements.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-700">Vitamin &amp; suplemen terverifikasi</h4>
            <ul className="space-y-1 text-sm text-slate-800">
              {supplements.map(s => <li key={s.id}>{String(s.administrationDate)} &mdash; {String(s.supplementType)}</li>)}
            </ul>
          </div>
        )}
        {upcoming.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            Jadwal imunisasi belum tersedia karena katalog resmi belum disahkan. Konfirmasikan jadwal dengan Posyandu/Puskesmas.
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-800">
            {upcoming.map(r => <li key={r.id}>{r.name} &mdash; usia sasaran {r.targetAgeMonths} bulan <span className="text-xs text-slate-500">(katalog {r.version})</span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
