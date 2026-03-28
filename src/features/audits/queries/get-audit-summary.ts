import { createClient } from "@/lib/supabase/server";

type ChecklistRow = { id: string };
type ChecklistItemRow = { outcome: string | null };
type NonConformityRow = { id: string; status: string | null };
type CorrectiveActionRow = { status: string | null };

export interface AuditSummary {
  totalItems: number;
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  pending: number;
  compliancePercentage: number;
  nonConformitiesCount: number;
  openNonConformities: number;
  completedActions: number;
  pendingActions: number;
}

/**
 * Fetches aggregate statistics for an audit.
 * Server-side only (uses next/headers via createClient).
 * Called from page.tsx and passed as a prop — never called from a Client Component.
 */
export async function getAuditSummary(auditId: string): Promise<AuditSummary> {
  const supabase = await createClient();

  // ── Checklist items ──────────────────────────────────────────────────────────
  // STEP 1: Recupera le checklist dell'audit; checklist_items si collega via checklist_id
  const { data: checklists } = await supabase
    .from("checklists")
    .select("id")
    .eq("audit_id", auditId);

  const checklistIds = (checklists ?? []).map((checklist: ChecklistRow) => checklist.id);

  // STEP 2: Se nessuna checklist, ritorna statistiche vuote
  let compliant = 0;
  let nonCompliant = 0;
  let notApplicable = 0;
  let pending = 0;
  let totalItems = 0;
  let compliancePercentage = 0;

  // STEP 3: Se ci sono checklist, recupera gli items tramite checklist_id
  if (checklistIds.length > 0) {
    const { data: items } = await supabase
      .from("checklist_items")
      .select("outcome")
      .in("checklist_id", checklistIds);

    const safeItems: ChecklistItemRow[] = items ?? [];
    compliant = safeItems.filter((item) => item.outcome === "compliant").length;
    nonCompliant = safeItems.filter((item) => item.outcome === "non_compliant").length;
    notApplicable = safeItems.filter((item) => item.outcome === "not_applicable").length;
    pending = safeItems.filter((item) => item.outcome === "pending").length;
    totalItems = safeItems.length;
    // Score formula: compliant / (total - notApplicable) * 100
    // NA items are not scored (excluded from denominator)
    const scorableItems = totalItems - notApplicable;
    compliancePercentage =
      scorableItems > 0
        ? Math.round((compliant / scorableItems) * 100)
        : 0;
  }

  // ── Non-conformities ─────────────────────────────────────────────────────────
  // Select both `id` and `status` — id is required for the CA query below.
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select("id, status")
    .eq("audit_id", auditId)
    .is("deleted_at", null);

  const safeNcs: NonConformityRow[] = ncs ?? [];
  const nonConformitiesCount = safeNcs.length;
  const openNonConformities = safeNcs.filter((nonConformity) => nonConformity.status === "open").length;

  // ── Corrective actions ───────────────────────────────────────────────────────
  const ncIds = safeNcs.map((nonConformity) => nonConformity.id);
  let completedActions = 0;
  let pendingActions = 0;

  if (ncIds.length > 0) {
    const { data: cas } = await supabase
      .from("corrective_actions")
      .select("status")
      .in("non_conformity_id", ncIds)
      .is("deleted_at", null);

    const safeCas: CorrectiveActionRow[] = cas ?? [];
    completedActions = safeCas.filter((action) => action.status === "completed").length;
    pendingActions = safeCas.filter((action) => action.status === "pending").length;
  }

  return {
    totalItems,
    compliant,
    nonCompliant,
    notApplicable,
    pending,
    compliancePercentage,
    nonConformitiesCount,
    openNonConformities,
    completedActions,
    pendingActions,
  };
}
