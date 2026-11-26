import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { getOperationalNotices } from "@/lib/operations/notifications";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const notifications = await getOperationalNotices(auth.posyanduId, auth.uid, auth.role);
  return NextResponse.json({ notifications }, { headers: { "Cache-Control": "no-store" } });
}
