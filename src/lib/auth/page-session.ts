import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";

export async function requirePageSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;
  if (!session) redirect("/login");
  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch {
    redirect("/login");
  }
}
