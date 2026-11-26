import type { QuerySnapshot } from "firebase-admin/firestore";

export type Row = { id: string } & Record<string, unknown>;

/** Maps a Firestore snapshot to plain rows (document id + fields). */
export function rowsOf(snap: QuerySnapshot): Row[] {
  return snap.docs.map(d => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}
