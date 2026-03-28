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

type AuditTrailRow = {
  audit_id: string;
  changed_at: string;
  changed_by: string;
  id: string;
  new_status: string;
  old_status: string | null;
  profiles: { email?: string | null } | Array<{ email?: string | null }> | null;
};

function getProfileEmail(profileRelation: AuditTrailRow["profiles"]): string | undefined {
  const profile = Array.isArray(profileRelation) ? profileRelation[0] : profileRelation;
  return profile?.email ?? undefined;
}

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

  const trailEntries: AuditTrailEntry[] = ((entries ?? []) as AuditTrailRow[]).map((entry) => {
    return {
      id: String(entry.id),
      auditId: String(entry.audit_id),
      oldStatus: entry.old_status,
      newStatus: entry.new_status,
      changedBy: String(entry.changed_by),
      changedAt: entry.changed_at,
      changedByEmail: getProfileEmail(entry.profiles),
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

  const auditTrailEntry = entry as AuditTrailRow;
  return {
    id: String(auditTrailEntry.id),
    auditId: String(auditTrailEntry.audit_id),
    oldStatus: auditTrailEntry.old_status,
    newStatus: auditTrailEntry.new_status,
    changedBy: String(auditTrailEntry.changed_by),
    changedAt: auditTrailEntry.changed_at,
    changedByEmail: getProfileEmail(auditTrailEntry.profiles),
  };
}
