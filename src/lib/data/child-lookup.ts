import { adminDb } from "@/lib/firebase/admin";

export type ChildLabel = { fullName: string; registrationNumber: string };

/** Resolves child display labels for ids, restricted to the active tenant. */
export async function lookupChildLabels(posyanduId: string, childIds: string[]): Promise<Map<string, ChildLabel>> {
  const unique = [...new Set(childIds.filter(Boolean))];
  const docs = await Promise.all(unique.map(id => adminDb.collection("children").doc(id).get()));
  const map = new Map<string, ChildLabel>();
  for (const doc of docs) {
    const d = doc.data();
    if (doc.exists && d && d.posyanduId === posyanduId) {
      map.set(doc.id, { fullName: String(d.fullName || "-"), registrationNumber: String(d.registrationNumber || "-") });
    }
  }
  return map;
}

export function todayInJakarta(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}
