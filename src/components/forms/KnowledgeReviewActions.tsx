"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export const KnowledgeReviewActions: React.FC<{ documentId: string }> = ({ documentId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const approve = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/knowledge/${encodeURIComponent(documentId)}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Materi gagal disahkan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Materi gagal disahkan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="text-xs font-medium text-rose-800">{error}</p>}
      <Button type="button" onClick={approve} disabled={loading}>{loading ? "Memproses..." : "Sahkan materi"}</Button>
    </div>
  );
};
