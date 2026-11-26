"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export const CorrectionReviewActions: React.FC<{ requestId: string }> = ({ requestId }) => {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const decide = async (decision: "accepted" | "rejected") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/corrections/${encodeURIComponent(requestId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Keputusan gagal disimpan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Keputusan gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input value={note} onChange={e => setNote(e.target.value)} className="posyandu-input"
        placeholder="Catatan keputusan (min. 5 karakter)" aria-label="Catatan keputusan" />
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => decide("accepted")} disabled={loading || note.trim().length < 5}>Terima</Button>
        <Button variant="outline" onClick={() => decide("rejected")} disabled={loading || note.trim().length < 5}>Tolak</Button>
      </div>
    </div>
  );
};
