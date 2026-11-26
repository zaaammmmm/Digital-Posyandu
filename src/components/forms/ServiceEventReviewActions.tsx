"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export const ServiceEventReviewActions: React.FC<{ kind: "immunization" | "supplement"; eventId: string }> = ({ kind, eventId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const decide = async (decision: "verified" | "rejected") => {
    setLoading(true);
    setError("");
    try {
      const base = kind === "immunization" ? "immunizations" : "supplements";
      const res = await fetch(`/api/${base}/${encodeURIComponent(eventId)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
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
      {error && <p role="alert" className="text-xs font-medium text-rose-800">{error}</p>}
      {rejecting && (
        <input aria-label="Alasan penolakan" className="posyandu-input" placeholder="Alasan penolakan (wajib)"
          value={reason} onChange={e => setReason(e.target.value)} />
      )}
      <div className="flex gap-2">
        {!rejecting && <Button type="button" disabled={loading} onClick={() => decide("verified")}>Sahkan</Button>}
        {!rejecting
          ? <Button type="button" variant="outline" disabled={loading} onClick={() => setRejecting(true)}>Tolak</Button>
          : <>
              <Button type="button" variant="danger" disabled={loading || reason.trim().length < 5} onClick={() => decide("rejected")}>Konfirmasi tolak</Button>
              <Button type="button" variant="outline" disabled={loading} onClick={() => { setRejecting(false); setReason(""); }}>Batal</Button>
            </>}
      </div>
    </div>
  );
};
