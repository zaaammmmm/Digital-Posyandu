"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export const KnowledgeCreateForm: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [version, setVersion] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, text, sourceTitle, version,
          sourceUrl: sourceUrl.trim() || null,
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Materi gagal disimpan.");
      setMessage("Materi disimpan dengan status menunggu peninjauan.");
      setTitle(""); setText(""); setSourceTitle(""); setSourceUrl(""); setVersion(""); setKeywords("");
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Materi gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="posyandu-card p-5 sm:p-6 space-y-3">
      <h4 className="font-semibold text-sm sm:text-base text-slate-900">Ajukan Materi Baru</h4>
      <p className="text-xs text-slate-500">Materi baru berstatus menunggu peninjauan dan baru dipakai setelah disahkan.</p>
      <div>
        <label className="posyandu-label" htmlFor="kn-title">Judul</label>
        <input id="kn-title" required className="posyandu-input" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="posyandu-label" htmlFor="kn-text">Isi materi</label>
        <textarea id="kn-text" required rows={6} maxLength={30000} className="posyandu-input" value={text} onChange={e => setText(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="posyandu-label" htmlFor="kn-source">Judul sumber</label>
          <input id="kn-source" required className="posyandu-input" value={sourceTitle} onChange={e => setSourceTitle(e.target.value)} />
        </div>
        <div>
          <label className="posyandu-label" htmlFor="kn-version">Versi sumber</label>
          <input id="kn-version" required className="posyandu-input" value={version} onChange={e => setVersion(e.target.value)} placeholder="Misal: 2023" />
        </div>
      </div>
      <div>
        <label className="posyandu-label" htmlFor="kn-url">Tautan sumber (opsional, http/https)</label>
        <input id="kn-url" type="url" className="posyandu-input" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} />
      </div>
      <div>
        <label className="posyandu-label" htmlFor="kn-keywords">Kata kunci (pisahkan dengan koma)</label>
        <input id="kn-keywords" className="posyandu-input" value={keywords} onChange={e => setKeywords(e.target.value)} />
      </div>
      {message && (
        <p role={isError ? "alert" : "status"} className={`rounded-[10px] border px-3.5 py-2.5 text-xs font-medium ${isError
          ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{message}</p>
      )}
      <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Kirim untuk ditinjau"}</Button>
    </form>
  );
};
