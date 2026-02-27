import { createClient } from "@/lib/supabase/server";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";

export type { AuditStatus };

export type Audit = {
  id: string;
  title: string | null;
  status: AuditStatus;
  scheduled_date: string | null;
};

export async function getAudits(): Promise<Audit[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return [];
  }

  const { data: audits, error: auditsError } = await supabase
    .from("audits")
    .select("id, title, status, scheduled_date")
    .eq("organization_id", profile.organization_id)
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

