import React from "react";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { UserManager, ManagedUser } from "@/components/forms/UserManager";

export default async function UsersPage() {
  const ctx = await requirePageContext(["posyandu_admin", "system_admin"]);
  const snap = await adminDb.collection("memberships").where("posyanduId", "==", ctx.posyanduId).limit(200).get();
  const users: ManagedUser[] = await Promise.all(snap.docs.map(async doc => {
    const m = doc.data();
    try {
      const u = await adminAuth.getUser(String(m.userId));
      return { uid: u.uid, email: u.email || "-", displayName: u.displayName || "-",
        role: String(m.role), status: String(m.status) };
    } catch {
      return { uid: String(m.userId), email: "(akun tidak tersedia)", displayName: "-",
        role: String(m.role), status: String(m.status) };
    }
  }));
  users.sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email));
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Pengguna &amp; Peran</h2>
          <p className="posyandu-page-subtitle">
            Akun hanya berlaku untuk Posyandu aktif. Peran menentukan data yang dapat dibuka.
          </p>
        </div>
      </div>
      <UserManager users={users} selfUid={ctx.uid} />
    </div>
  );
}
