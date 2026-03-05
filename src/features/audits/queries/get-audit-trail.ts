import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export type AuditTrailEntry = {
  id: string;
  auditId: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  changedByEmail?: string;
};

export type AuditTrailHistory = {
  auditId: string;
  entries: AuditTrailEntry[];
  totalCount: number;
};

/**
 * Fetch audit trail (status change history) for a specific audit.
 * Enforces organization_id security check.
 * Returns entries in reverse chronological order (newest first).
 */
export async function getAuditTrail(auditId: string): Promise<AuditTrailHistory | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  // Verify audit belongs to user's organization
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("organization_id")
    .eq("id", auditId)
    .single();

  if (auditError || !audit || audit.organization_id !== organizationId) {
    return null;
  }

  const { data: entries, error: entriesError } = await supabase
    .from("audit_trail")
    .select(
      `
      id,
      audit_id,
      old_status,
      new_status,
      changed_by,
      changed_at,
      profiles!audit_trail_changed_by_fkey(email)
    `
    )
    .eq("audit_id", auditId)
    .eq("organization_id", organizationId)
    .order("changed_at", { ascending: false });

  if (entriesError) {
    return null;
  }

  const trailEntries: AuditTrailEntry[] = (entries || []).map((entry: any) => {
    const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
    return {
      id: String(entry.id),
      auditId: String(entry.audit_id),
      oldStatus: entry.old_status,
      newStatus: entry.new_status,
      changedBy: String(entry.changed_by),
      changedAt: entry.changed_at,
      changedByEmail: profile?.email,
    };
  });

  return {
    auditId,
    entries: trailEntries,
    totalCount: trailEntries.length,
  };
}

/**
 * Get the most recent status change for an audit.
 */
export async function getLatestAuditStatusChange(
  auditId: string
): Promise<AuditTrailEntry | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  // Verify audit belongs to user's organization
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("organization_id")
    .eq("id", auditId)
    .single();

  if (auditError || !audit || audit.organization_id !== organizationId) {
    return null;
  }

  const { data: entry, error: entryError } = await supabase
    .from("audit_trail")
    .select(
      `
      id,
      audit_id,
      old_status,
      new_status,
      changed_by,
      changed_at,
      profiles!audit_trail_changed_by_fkey(email)
    `
    )
    .eq("audit_id", auditId)
    .eq("organization_id", organizationId)
    .order("changed_at", { ascending: false })
    .limit(1)
    .single();

  if (entryError || !entry) {
    return null;
  }

  const authorProfile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
  return {
    id: String(entry.id),
    auditId: String(entry.audit_id),
    oldStatus: entry.old_status,
    newStatus: entry.new_status,
    changedBy: String(entry.changed_by),
    changedAt: entry.changed_at,
    changedByEmail: (authorProfile as any)?.email,
  };
}
