import { adminDb } from "@/lib/firebase/admin";

export type ApprovedSnippet = {
  id: string; title: string; text: string; sourceTitle: string;
  sourceUrl?: string; version: string; reviewedAt: string;
};

export async function retrieveApprovedKnowledge(query: string, limit = 4): Promise<ApprovedSnippet[]> {
  // Firestore text search is not native; this MVP uses explicitly curated tags/keywords.
  // Replace with a vector index only after embedding provenance and evaluation are ready.
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean).slice(0, 8);
  if (!terms.length) return [];
  const snap = await adminDb.collection("knowledge_documents")
    .where("status", "==", "approved").limit(100).get();
  return snap.docs.map(doc => {
    const d = doc.data();
    const searchable = `${d.title || ""} ${d.text || ""} ${(d.keywords || []).join(" ")}`.toLowerCase();
    const score = terms.reduce((n, term) => n + (searchable.includes(term) ? 1 : 0), 0);
    return { id: doc.id, title: d.title || "Materi edukasi", text: d.text || "",
      sourceTitle: d.sourceTitle || "", sourceUrl: d.sourceUrl, version: d.version || "unknown",
      reviewedAt: d.reviewedAt || "", score };
  }).filter(item => item.score > 0 && item.sourceTitle && item.reviewedAt)
    .sort((a, b) => b.score - a.score).slice(0, limit)
    .map(({ score, ...item }) => item);
}
