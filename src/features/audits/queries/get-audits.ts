import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";

export type { AuditStatus };

export type Audit = {
  id: string;
  title: string | null;
  status: AuditStatus;
  scheduled_date: string | null;
  score: number | null;
  template_id: string | null;
  client_id: string | null;
  location_id: string | null;
  client_name: string | null;
  location_name: string | null;
};

export type AuditWithNCCount = Audit & {
  nc_count: number;
};

export async function getAudits(): Promise<AuditWithNCCount[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId, role, clientId } = ctx;

  let query = supabase
    .from("audits")
    .select("id, title, status, scheduled_date, score, template_id, client_id, location_id")
    .eq("organization_id", organizationId);

  if (role === "client" && clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: audits, error: auditsError } = await query.order("scheduled_date", {
    ascending: false,
  });

  if (auditsError || !audits) return [];

  const clientIds = Array.from(
    new Set(
      audits
        .map((audit: any) => audit.client_id as string | null)
        .filter((value): value is string => Boolean(value))
    )
  );
  const locationIds = Array.from(
    new Set(
      audits
        .map((audit: any) => audit.location_id as string | null)
        .filter((value): value is string => Boolean(value))
    )
  );

  const [{ data: clients }, { data: locations }] = await Promise.all([
    clientIds.length > 0
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null }> }),
    locationIds.length > 0
      ? supabase.from("locations").select("id, name").in("id", locationIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null }> }),
  ]);

  const clientNameById = new Map(
    (clients ?? []).map((client: { id: string; name: string | null }) => [client.id, client.name])
  );
  const locationNameById = new Map(
    (locations ?? []).map((location: { id: string; name: string | null }) => [
      location.id,
      location.name,
    ])
  );

  const auditIds = audits.map((audit: any) => audit.id);
  const { data: ncCounts } = await supabase
    .from("non_conformities")
    .select("audit_id")
    .in("audit_id", auditIds)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  const ncCountByAuditId = (ncCounts ?? []).reduce(
    (acc: Record<string, number>, nc: any) => {
      acc[nc.audit_id] = (acc[nc.audit_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return audits.map((audit: any) => ({
    id: String(audit.id),
    title: audit.title ?? null,
    status: audit.status ?? "Scheduled",
    scheduled_date: audit.scheduled_date ?? null,
    score: audit.score ?? null,
    template_id: audit.template_id ?? null,
    client_id: audit.client_id ?? null,
    location_id: audit.location_id ?? null,
    client_name: audit.client_id ? clientNameById.get(audit.client_id) ?? null : null,
    location_name: audit.location_id
      ? locationNameById.get(audit.location_id) ?? null
      : null,
    nc_count: ncCountByAuditId[audit.id] ?? 0,
  }));
}
