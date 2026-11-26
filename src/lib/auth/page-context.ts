import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageSession } from "@/lib/auth/page-session";
import type { Role } from "@/types/verification";

export type PageContext = { uid: string; posyanduId: string; role: Role };

const ROLES: Role[] = ["parent", "cadre", "health_worker", "posyandu_admin", "content_reviewer", "system_admin"];

export const ROLE_HOME: Record<Role, string> = {
  parent: "/parent",
  cadre: "/cadre",
  health_worker: "/health-worker",
  posyandu_admin: "/admin",
  content_reviewer: "/reviewer",
  system_admin: "/admin",
};

/**
 * Server-side page guard: resolves the session cookie and the active tenant
 * membership. The role always comes from the membership document, never from a
 * cookie or request value. Users with another role are sent to their own home.
 */
export async function requirePageContext(allowedRoles?: Role[]): Promise<PageContext> {
  const session = await requirePageSession();
  const posyanduId = (await cookies()).get("active_posyandu")?.value;
  if (!posyanduId) redirect("/login");
  const snap = await adminDb.collection("memberships").doc(`${session.uid}_${posyanduId}`).get();
  const m = snap.data();
  if (!snap.exists || !m || m.userId !== session.uid || m.posyanduId !== posyanduId
      || m.status !== "active" || !ROLES.includes(m.role)) redirect("/login");
  const role = m.role as Role;
  if (allowedRoles && !allowedRoles.includes(role)) redirect(ROLE_HOME[role]);
  return { uid: session.uid, posyanduId, role };
}
