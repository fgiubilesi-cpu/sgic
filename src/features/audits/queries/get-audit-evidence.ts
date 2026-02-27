import { createClient } from "@/lib/supabase/server";

export type EvidenceItem = {
  id: string;
  checklistItemId: string;
  question: string;
  outcome: string;
  evidenceUrl: string;
  uploadedAt: string | null;
};

export type AuditEvidence = {
  auditId: string;
  organizationId: string;
  evidenceItems: EvidenceItem[];
  totalCount: number;
};

/**
 * Fetch all evidence (photos) linked to a specific audit
 * Includes the associated checklist question text for context
 * Enforces organization_id security check
 */
export async function getAuditEvidence(auditId: string): Promise<AuditEvidence | null> {
  const supabase = await createClient();

  // Get current user's organization
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return null;
  }

  // Verify audit belongs to user's organization
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("organization_id")
    .eq("id", auditId)
    .single();

  if (auditError || !audit || audit.organization_id !== profile.organization_id) {
    return null;
  }

  // Fetch all checklist items with evidence for this audit
  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("id, question, outcome, evidence_url, created_at")
    .eq("audit_id", auditId)
    .not("evidence_url", "is", null)
    .order("created_at", { ascending: false });

  if (itemsError) {
    return null;
  }

  const evidenceItems: EvidenceItem[] = (items || []).map((item: any) => ({
    id: String(item.id),
    checklistItemId: String(item.id),
    question: item.question ?? "Untitled Question",
    outcome: item.outcome ?? "pending",
    evidenceUrl: item.evidence_url,
    uploadedAt: item.created_at,
  }));

  return {
    auditId,
    organizationId: profile.organization_id,
    evidenceItems,
    totalCount: evidenceItems.length,
  };
}

/**
 * Fetch evidence by specific outcome type (e.g., only "non_compliant" items with evidence)
 */
export async function getAuditEvidenceByOutcome(
  auditId: string,
  outcome: string
): Promise<EvidenceItem[]> {
  const supabase = await createClient();

  // Get current user's organization
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  // Verify audit belongs to user's organization
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("organization_id")
    .eq("id", auditId)
    .single();

  if (auditError || !audit || audit.organization_id !== profile.organization_id) {
    return [];
  }

  // Fetch checklist items with evidence matching the specific outcome
  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("id, question, outcome, evidence_url, created_at")
    .eq("audit_id", auditId)
    .eq("outcome", outcome)
    .not("evidence_url", "is", null)
    .order("created_at", { ascending: false });

  if (itemsError) {
    return [];
  }

  return (items || []).map((item: any) => ({
    id: String(item.id),
    checklistItemId: String(item.id),
    question: item.question ?? "Untitled Question",
    outcome: item.outcome ?? "pending",
    evidenceUrl: item.evidence_url,
    uploadedAt: item.created_at,
  }));
}
