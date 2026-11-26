"use client";

import React, { useState } from "react";
import { BookOpenCheck, Send, ShieldAlert } from "lucide-react";

type Citation = {
  marker: string; documentId: string; title: string; sourceTitle: string;
  sourceUrl: string | null; version: string; reviewedAt: string;
};
type ChatResult = { status: string; answer: string; citations: Citation[]; disclaimer: string };

const STATUS_LABEL: Record<string, string> = {
  answered: "Jawaban dari materi yang disahkan",
  abstained_no_source: "Belum ada sumber yang memadai",
  emergency_referral: "Segera cari bantuan medis",
  declined_clinical: "Perlu ditanyakan ke petugas",
  refused_injection: "Pertanyaan tidak dapat diproses",
  fallback_unverified: "Jawaban tidak dapat diverifikasi",
  invalid_question: "Pertanyaan tidak valid",
};

/** Render [S1] markers as superscript references; text is never injected as HTML. */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[S\d{1,2}(?:\s*,\s*S\d{1,2})*\])/g);
  return (
    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
      {parts.map((part, i) => /^\[S/.test(part)
        ? <sup key={i} className="ml-0.5 font-semibold text-emerald-700">{part.replace(/[[\]\s]/g, "")}</sup>
        : <React.Fragment key={i}>{part}</React.Fragment>)}
    </p>
  );
}

export function EducationChat() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChatResult | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || question.trim().length < 3) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Pertanyaan tidak dapat diproses.");
      else setResult(data as ChatResult);
    } catch {
      setError("Koneksi bermasalah. Coba lagi atau tanyakan kepada petugas Posyandu.");
    } finally {
      setLoading(false);
    }
  }

  const urgent = result?.status === "emergency_referral";
  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="posyandu-card space-y-3 p-5">
        <label htmlFor="edu-question" className="text-sm font-semibold text-slate-900">Pertanyaan edukasi</label>
        <textarea id="edu-question" value={question} onChange={e => setQuestion(e.target.value.slice(0, 500))} rows={3}
          className="posyandu-input w-full" placeholder="Contoh: Kapan bayi mulai diberi MPASI?" />
        <p className="text-xs text-slate-500">
          Jangan menulis nama, nomor telepon, atau data pribadi anak. Chatbot hanya menjawab dari materi yang telah ditinjau
          dan tidak memberi diagnosis, obat, atau dosis. {question.length}/500
        </p>
        <button type="submit" disabled={loading || question.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-[10px] bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Send size={16} aria-hidden="true" /> {loading ? "Mencari sumber..." : "Tanya"}
        </button>
      </form>
      {error && <div role="alert" className="posyandu-card border-l-4 border-l-red-600 p-4 text-sm text-red-800">{error}</div>}
      {result && (
        <section aria-live="polite" className={`posyandu-card space-y-3 border-l-4 p-5 ${urgent ? "border-l-red-600" : "border-l-emerald-600"}`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {urgent ? <ShieldAlert size={16} aria-hidden="true" /> : <BookOpenCheck size={16} aria-hidden="true" />}
            {STATUS_LABEL[result.status] || "Hasil"}
          </h2>
          <AnswerText text={result.answer} />
          {result.citations.length > 0 && (
            <div className="space-y-1 border-t border-slate-200 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sumber</h3>
              <ul className="space-y-1 text-xs text-slate-600">
                {result.citations.map(c => (
                  <li key={c.marker}>
                    <strong className="text-emerald-700">{c.marker}</strong> {c.title} &bull; {c.sourceTitle} &bull; versi {c.version}
                    {" "}&bull; ditinjau {c.reviewedAt.slice(0, 10)}
                    {c.sourceUrl ? <> &bull; <a className="text-emerald-700 hover:underline" href={c.sourceUrl} target="_blank" rel="noreferrer noopener">tautan</a></> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="rounded-[10px] bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{result.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
