import React from "react";
import { requirePageContext } from "@/lib/auth/page-context";

// The registration form is a client component, so the role guard lives in this server layout.
export default async function NewChildLayout({ children }: { children: React.ReactNode }) {
  await requirePageContext(["cadre", "posyandu_admin"]);
  return <>{children}</>;
}
