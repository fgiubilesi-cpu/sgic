import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";

export type { AuditStatus };

export type ClientAudit = {
  id: string;
  title: string | null;
  status: AuditStatus;
  scheduled_date: string | null;
  score: number | null;
  location_id: string | null;
  location_name: string | null;
};

/**
 * Fetch audits visible to the current client user.
 * Only returns audits for the client's own client_id.
 */
export async function getClientAudits(): Promise<ClientAudit[]> {
  const ctx = await getOrganizationContext();
  if (!ctx || ctx.role !== "client" || !ctx.clientId) {
    return [];
  }

  const { supabase, clientId } = ctx;

  const { data: audits, error: auditsError } = await supabase
    .from("audits")
    .select(
      "id, title, status, scheduled_date, score, location_id, location:location_id(name)"
    )
    .eq("client_id", clientId)
    .order("scheduled_date", { ascending: false });

  if (auditsError || !audits) {
    return [];
  }

  return audits.map((audit: any) => ({
    id: String(audit.id),
    title: audit.title ?? null,
    status: audit.status ?? "Scheduled",
    scheduled_date: audit.scheduled_date ?? null,
    score: audit.score ?? null,
    location_id: audit.location_id ?? null,
    location_name: audit.location?.name ?? null,
  }));
}
