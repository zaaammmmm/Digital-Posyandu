import { redirect } from "next/navigation";
import { requirePageContext, ROLE_HOME } from "@/lib/auth/page-context";

export default async function DashboardRootPage() {
  const ctx = await requirePageContext();
  redirect(ROLE_HOME[ctx.role]);
}
