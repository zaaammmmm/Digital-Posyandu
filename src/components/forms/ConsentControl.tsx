"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

type Props = { childId: string; purpose: string; noticeVersion: string; allowed: boolean };

export const ConsentControl: React.FC<Props> = ({ childId, purpose, noticeVersion, allowed }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (consentStatus: "granted" | "withdrawn") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, purpose, noticeVersion, consentStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Pilihan gagal disimpan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pilihan gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="text-xs font-medium text-rose-800">{error}</p>}
      {allowed
        ? <Button type="button" variant="outline" disabled={loading} onClick={() => send("withdrawn")}>Cabut persetujuan</Button>
        : <Button type="button" disabled={loading} onClick={() => send("granted")}>Berikan persetujuan</Button>}
    </div>
  );
};
