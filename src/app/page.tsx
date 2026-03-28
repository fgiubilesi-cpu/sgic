import { redirect } from "next/navigation";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ctx = await getOrganizationContext();

  if (!ctx) {
    redirect("/login");
  }

  redirect(ctx.role === "client" ? "/client-dashboard" : "/my-day");
}
