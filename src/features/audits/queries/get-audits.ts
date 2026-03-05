import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";

export type { AuditStatus };

export type Audit = {
  id: string;
  title: string | null;
  status: AuditStatus;
  scheduled_date: string | null;
};

export async function getAudits(): Promise<Audit[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  const { data: audits, error: auditsError } = await supabase
    .from("audits")
    .select("id, title, status, scheduled_date")
    .eq("organization_id", organizationId)
    .order("scheduled_date", { ascending: false });

  if (auditsError || !audits) {
    return [];
  }

  return audits.map((audit) => ({
    id: String(audit.id),
    title: (audit as { title?: string | null }).title ?? null,
    status: (audit as { status?: AuditStatus | null }).status ?? "Scheduled",
    scheduled_date:
      (audit as { scheduled_date?: string | null }).scheduled_date ?? null,
  }));
}
