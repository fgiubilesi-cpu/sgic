import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";

export type { AuditStatus };

export type Audit = {
  id: string;
  title: string | null;
  status: AuditStatus;
  scheduled_date: string | null;
  score: number | null;
  client_id: string | null;
  location_id: string | null;
  client_name: string | null;
  location_name: string | null;
};

export async function getAudits(): Promise<Audit[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  const { data: audits, error: auditsError } = await supabase
    .from("audits")
    .select("id, title, status, scheduled_date, score, client_id, location_id, client:client_id(name), location:location_id(name)")
    .eq("organization_id", organizationId)
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
    client_id: audit.client_id ?? null,
    location_id: audit.location_id ?? null,
    client_name: audit.client?.name ?? null,
    location_name: audit.location?.name ?? null,
  }));
}
