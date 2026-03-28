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

type ClientAuditRow = {
  id: string;
  location: { name?: string | null } | Array<{ name?: string | null }> | null;
  location_id: string | null;
  scheduled_date: string | null;
  score: number | null;
  status: AuditStatus | null;
  title: string | null;
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

  return (audits as ClientAuditRow[]).map((audit) => ({
    id: String(audit.id),
    title: audit.title ?? null,
    status: audit.status ?? "Scheduled",
    scheduled_date: audit.scheduled_date ?? null,
    score: audit.score ?? null,
    location_id: audit.location_id ?? null,
    location_name: (Array.isArray(audit.location) ? audit.location[0] : audit.location)?.name ?? null,
  }));
}
