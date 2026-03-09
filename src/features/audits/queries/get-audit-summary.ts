import { createClient } from "@/lib/supabase/server";

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
  // STEP 1: Recupera le checklist dell'audit (audit_id è denormalizzato in checklist_items)
  const { data: checklists } = await supabase
    .from("checklists")
    .select("id")
    .eq("audit_id", auditId);

  const checklistIds = checklists?.map((c: any) => c.id) ?? [];

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

    const safeItems = items ?? [];
    compliant = safeItems.filter((i: any) => i.outcome === "compliant").length;
    nonCompliant = safeItems.filter((i: any) => i.outcome === "non_compliant").length;
    notApplicable = safeItems.filter((i: any) => i.outcome === "not_applicable").length;
    pending = safeItems.filter((i: any) => i.outcome === "pending").length;
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
    .eq("audit_id", auditId);

  const safeNcs = ncs ?? [];
  const nonConformitiesCount = safeNcs.length;
  const openNonConformities = safeNcs.filter((n: any) => n.status === "open").length;

  // ── Corrective actions ───────────────────────────────────────────────────────
  const ncIds = safeNcs.map((n: any) => n.id as string);
  let completedActions = 0;
  let pendingActions = 0;

  if (ncIds.length > 0) {
    const { data: cas } = await supabase
      .from("corrective_actions")
      .select("status")
      .in("non_conformity_id", ncIds);

    const safeCas = cas ?? [];
    completedActions = safeCas.filter((c: any) => c.status === "completed").length;
    pendingActions = safeCas.filter((c: any) => c.status === "pending").length;
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
