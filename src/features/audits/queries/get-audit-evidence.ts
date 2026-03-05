import { getOrganizationContext } from "@/lib/supabase/get-org-context";

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
 * Fetch all evidence (photos) linked to a specific audit.
 * Includes the associated checklist question text for context.
 * Enforces organization_id security check.
 */
export async function getAuditEvidence(auditId: string): Promise<AuditEvidence | null> {
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
    organizationId,
    evidenceItems,
    totalCount: evidenceItems.length,
  };
}

/**
 * Fetch evidence by specific outcome type (e.g., only "non_compliant" items with evidence).
 */
export async function getAuditEvidenceByOutcome(
  auditId: string,
  outcome: string
): Promise<EvidenceItem[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  // Verify audit belongs to user's organization
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("organization_id")
    .eq("id", auditId)
    .single();

  if (auditError || !audit || audit.organization_id !== organizationId) {
    return [];
  }

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
