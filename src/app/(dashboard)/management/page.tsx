import { redirect } from "next/navigation";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { ManagementDashboard } from "@/features/management/components/management-dashboard";
import { ManagementLoadError } from "@/features/management/components/management-load-error";
import { getManagementDashboardData } from "@/features/management/queries/get-management-dashboard";

export const metadata = {
  title: "Management - SGIC",
  description: "Dashboard direzionale interna",
};

export default async function ManagementPage() {
  const ctx = await getOrganizationContext();

  if (!ctx) {
    redirect("/login");
  }

  if (ctx.role !== "admin") {
    redirect(ctx.role === "client" ? "/client-dashboard" : "/dashboard");
  }

  let data;

  try {
    data = await getManagementDashboardData(ctx);
  } catch (error) {
    console.error("[management] unable to load dashboard", error);
    return <ManagementLoadError error={error} />;
  }

  return <ManagementDashboard data={data} />;
}
