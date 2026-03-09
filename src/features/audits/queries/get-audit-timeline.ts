import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export interface AuditTimelineEvent {
  id: string;
  audit_id: string;
  audit_title: string | null;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  score: number | null;
  location_name: string | null;
  checklist_completion_percentage: number;
  nc_count: number;
  ac_closed_count: number;
}

/**
 * Get audit timeline for a client or location.
 * Shows audit history in reverse chronological order (newest first).
 */
export async function getAuditTimeline(
  clientId?: string,
  locationId?: string
): Promise<AuditTimelineEvent[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  let query = supabase
    .from("audits")
    .select(
      `
      id,
      title,
      status,
      scheduled_date,
      created_at,
      score,
      location:location_id(name),
      checklists(
        id,
        checklist_items(id, outcome)
      ),
      non_conformities(id, status)
    `
    )
    .eq("organization_id", organizationId)
    .order("scheduled_date", { ascending: false });

  // Filter by client if client user
  if (ctx.role === "client" && ctx.clientId) {
    query = query.eq("client_id", ctx.clientId);
  } else if (clientId) {
    // Filter by specific client if provided
    query = query.eq("client_id", clientId);
  }

  // Filter by location if provided
  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data: audits, error } = await query;

  if (error || !audits) {
    return [];
  }

  return audits.map((audit: any) => {
    // Calculate checklist completion percentage
    const checklist = audit.checklists?.[0];
    const items = checklist?.checklist_items || [];
    const completedItems = items.filter(
      (item: any) => item.outcome && item.outcome !== "Scheduled"
    ).length;
    const completionPercentage = items.length > 0 ? (completedItems / items.length) * 100 : 0;

    // Count closed corrective actions
    const nonConformities = audit.non_conformities || [];
    const closedACs = nonConformities.filter(
      (nc: any) => nc.status === "closed"
    ).length;

    return {
      id: String(audit.id),
      audit_id: String(audit.id),
      audit_title: audit.title ?? null,
      status: audit.status ?? "Scheduled",
      scheduled_date: audit.scheduled_date ?? null,
      completed_date: audit.created_at ?? null,
      score: audit.score ?? null,
      location_name: audit.location?.name ?? null,
      checklist_completion_percentage: Math.round(completionPercentage),
      nc_count: nonConformities.length,
      ac_closed_count: closedACs,
    };
  });
}
